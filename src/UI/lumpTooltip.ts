import { LumpType, FullListPlannerReport, PantheonSlot, DragonAuraReportEntry } from '../planner/types';
import { planner } from '../planner/planner';
import { preferences } from '../preferences';
import { previousAutoharvestTime, previousLumpT, warnPantheonNotLoaded } from './preAutoharvestDataRetrieval';

function currentLumpType(): LumpType | 'unknown' {
    switch(Game.lumpCurrentType) {
        case 0: return 'normal';
        case 1: return 'bifurcated';
        case 2: return 'golden';
        case 3: return 'meaty';
        case 4: return 'caramelized';
        default: return 'unknown';
    }
}

function makeLumpIcon(lumpType: LumpType) {
    let background = '';
    switch(lumpType) {
        case 'normal':      background = 'background-position: -1392px -672px;'; break;
        case 'bifurcated':  background = 'background-position: -1392px -720px;'; break;
        /* The golden lump's position is the almost-mature icon.
         * This is intentional;
         * it makes the golden lump a bit more visually distinct from the others.
         * It also looks better than the fully-matured one. */
        case 'golden':      background = 'background-position: -1344px -768px;'; break;
        case 'meaty':       background = 'background-position: -1392px -816px;'; break;
        case 'caramelized': background = 'background-position: -1392px -1296px;'; break;
    }
    return `<div class="icon" style="vertical-align: middle; margin: 0 -4px; ${background}"></div>`;
}

/* Returns a string for a <div> tag that displays the given dragon aura icon. */
function makeDragonAuraIcon(dragonAura: DragonAuraReportEntry) {
    let noteCharacter = '', noteColor = '';
    if(dragonAura.note == 'checkmark') {
        noteCharacter = '✔';
        noteColor = 'color:darkgreen';
    }
    if(dragonAura.note == 'warn') {
        noteCharacter = '⚠️';
    }
    let noteDiv = `<div style="width:12px;height:12px; position:absolute; top: 0px; right: 0px; ${noteColor}">${noteCharacter}</div>`;

    let transparency = '';
    if(dragonAura.style == 'faded') {
        transparency += 'opacity: 0.2;';
    }
    let background = '';
    switch(dragonAura.aura) {
        case "Dragon's Curve":    background = 'background-position: -960px -1200px;'; break;
        case "Reality Bending":   background = 'background-position: -1536px -1200px;'; break;
        case "Supreme Intellect": background = 'background-position: -1632px -1200px;'; break;
        case "none":              background = 'background-position:48px 48px;'; break;
    }
    let dragonDiv = '<div class="icon" style="vertical-align: middle; margin: 0 -4px;' + background + transparency + '"></div>';

    return '<div style="height: 48px; position:relative; display:inline-block; vertical-align:middle;">' + dragonDiv + noteDiv + '</div>';
}

/* Same as above but for buildings instead. */
function makeGrandmaIcon(type: string, transparent: boolean) {
    let background = "background-image: url('img/buildings.png?v=5');";
    let transparency = '';
    if(type === 'appeased') background += 'background-position: 0px -64px;';
    if(type === 'awoken') background += 'background-position: 0px -128px;';
    if(type === 'displeased') background += 'background-position: -64px -128px;';
    if(type === 'angered') background += 'background-position: -128px -128px;';
    if(transparent) transparency += 'opacity: 0.2;';
    return '<div style="display: inline-block; width:64px; height:64px; vertical-align: middle;' + background + transparency + '"></div>';
}

/* Similar as above, but builds a Rigidel with a pantheon icon instead.
 * slot === 0 means unslotted, slot === 1 means jade slot, 2 is ruby and 3 is diamond. */
function makeRigidelIcon(slot: PantheonSlot, note: 'checkmark' | 'warn' | '') {
    let rigidel = '<div class="icon" style="background-position:-1056px -912px"></div>';
    let gem_background = '';
    switch(slot) {
        case 'diamond': gem_background = 'background-position: -1104px -720px;'; break;
        case 'ruby':    gem_background = 'background-position: -1128px -720px;'; break;
        case 'jade':    gem_background = 'background-position: -1104px -744px;'; break;
        case 'none':    gem_background = 'background-position: -1128px -744px;'; // No background
    }
    let gem = '<div class="icon" style="width:24px;height:24px; position:absolute; top: 36px; left: 12px;' + gem_background + '"></div>';

    let noteCharacter = '', noteColor = '';
    if(note == 'checkmark') {
        noteCharacter = '✔';
        noteColor = 'color:darkgreen';
    }
    if(note == 'warn') {
        noteCharacter = '⚠️';
    }
    let noteDiv = `<div style="width:12px;height:12px; position:absolute; top: 0px; right: 0px; ${noteColor}">${noteCharacter}</div>`;

    return '<div style="height: 60px; position:relative; display:inline-block; vertical-align:middle;' + (slot=='none' ? 'opacity:0.2' : '') + '">' + rigidel + gem + noteDiv + '</div>';
}

// Builds a string that displays the discrepancy and the current lump type.
export function discrepancyTooltip() {
    /* The bunch of if-elses here is trying to remind the user about the peculiarities of the mod.
     * For example,
     * if previousLumpT === Game.lumpT,
     * no lumps were harvested between saving and loading the game,
     * so this function tries to remind the user to load the save game
     * only after a lump is autoharvested.
     *
     * Another example: if the actual discrepancy differs from the expected discrepancy,
     * then the lump type is probably not what the user wanted,
     * so there is a reminder to try to reload the game again.
     * (This is also the reason why the current lump type is shown here.)
     */
    let str = '<div>Expected discrepancy: ' + preferences.discrepancy + 'ms.</div>';
    let lumpType = currentLumpType();
    if(lumpType == 'unknown') {
        str += `<div>CYOL does not know about this lump type.
            You might be in a future version of Cookie Clicker that adds more lump types,
            or using a mod which adds lump types,
            or something is wrong with your save data.
        </div>`;
    } else {
        str += `<div>Current lump type: ${makeLumpIcon(lumpType)} ${lumpType}.</div>`;
    }

    if(Game.hasGod && warnPantheonNotLoaded) {
        str += '<div style="color:red">' +
            'The Pantheon was still loading when the current lump type was computed,' +
            ' so Rigidel may have had no effect.' +
            ' Try reloading your save game again if the lump type is not the expected type.' +
            '</div>';
    }

    if(previousAutoharvestTime != null) {
        let discrepancy = Game.lumpT - previousAutoharvestTime;
        if(Game.lumpT === previousLumpT) {
            str += '<div style="color:gray">' +
                'No discrepancy information to show.' +
                ' This is likely because no sugar lumps were harvested while the game was closed.' +
                ' Try exporting your save game and reloading after a lump is auto-harvested!' +
                '</div>';
        } else if(discrepancy < 0 || discrepancy > 100) {
            str += '<div>' +
                'The actual discrepancy is ' + discrepancy + ', which seems wrong...';
            if(discrepancy < 0) {
                str += ' Maybe no lump was harvested when the save game was loaded?';
            } else {
                str += ' Maybe more than one lump was harvested when the save game was loaded?';
            }
            str += '</div>';
            // The threshold is 100 because it is the highest the slider can go in the options menu
        } else {
            str += "<div>The actual discrepancy was ";
            if(discrepancy === preferences.discrepancy) {
                str += '<div style="display:inline; color:green">' + discrepancy + ' milliseconds</div>,';
                str += ' precisely what we expected!<br />';
            } else {
                str += '<div style="display:inline; color:red">' + discrepancy + ' milliseconds</div>,';
                if(discrepancy < preferences.discrepancy)
                    str += ' less than what we expected.';
                else
                    str += ' more than what we expected.';
            }
            if(discrepancy !== preferences.discrepancy)
                str += ' Try reloading the save if the lump has the wrong type.';
            str += '</div>';
        }
    } else {
        str += '<div style="color:gray">No discrepancy information to show.' +
            ' Try loading your game after CYOL finishes launching!' +
            '</div>';
    }

    return str;
}

// Constructs a fancy table of predictions
export function makeFullListReport(report: FullListPlannerReport) {
    let configurations = report.flat(); // TODO: Print this prettier
    let str = '';
    let i;
    for(i = 0; i < configurations.length && i < preferences.rowsToDisplay; i++) {
        str += makeLumpIcon(configurations[i].lumpType) + ':';
        if(configurations[i].grandmaCount === null) {
            str += '&nbsp;&nbsp;&nbsp;'; // kludge
        } else {
            str += '<div style="width: 5ex; display: inline-block; vertical-align:middle; text-align:right; margin-right:5px;">' + configurations[i].grandmaCount + 'x</div>';
        }

        let grandmapocalypseStages = configurations[i].grandmapocalypseStages;
        str += makeGrandmaIcon('appeased', !grandmapocalypseStages[0]);
        str += makeGrandmaIcon('awoken', !grandmapocalypseStages[1]);
        str += makeGrandmaIcon('displeased', !grandmapocalypseStages[2]);
        str += makeGrandmaIcon('angered', !grandmapocalypseStages[3]);
        for(let dragonAura of configurations[i].dragonAuras) {
            str += makeDragonAuraIcon(dragonAura);
        }
        str += makeRigidelIcon(configurations[i].rigidelSlot, configurations[i].rigidelNote);
        str += '<br />';
    }
    if(i < preferences.rowsToDisplay) {
        str += 'No other matching predictions found.';
        if(i == 0) {
            str += '<br />Try displaying more lump types in the settings!';
        }
    }
    return str;
}

/* This function is pushed to CCSE's `Game.customLumpTooltip` on init by main.ts.
 */
export function customLumpTooltip(str: string, _phase: number) {
    str = str.replace('width:400px','width:500px'); // FIXME kludge; widens the tooltip box
    str += '<div class="line"></div>';

    str += discrepancyTooltip();
    str += '<div class="line"></div>';

    // Next lump type
    let prediction, isCurrent;
    ({ prediction, isCurrent } = planner.getAndUpdateLumpTypePrediction());
    str += 'Predicted next lump type: ' + makeLumpIcon(prediction) + ' ' + prediction + '.';
    if(Game.hasGod && Game.BuildingsOwned%10!==0 && Game.hasGod('order')) {
        str += ' Rigidel not active!';
    }
    if(!isCurrent) {
        str += ' (recalculating...)';
    }
    str += '<br />';

    // TODO: if(preferences.reportType == 'filtered') ...
    let report;
    ({ report, isCurrent } = planner.getAndUpdateFullListReport());
    if(isCurrent) {
        str += 'Predictions: <br />';
    } else {
        str += 'Predictions (recalculating...): <br />';
    }
    str += makeFullListReport(report);
    return str;
}
