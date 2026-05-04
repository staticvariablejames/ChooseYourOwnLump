import type { LumpType, PlannerReportEntry, SummaryPlannerReport, FullListPlannerReport, PantheonSlot, DragonAuraReportEntry } from '../planner/types';
import { planner } from '../planner/planner';
import { preferences } from '../preferences';
import { discrepancyInfo } from '../discrepancyInfo';
import { scrolledRows, capScrolledRows } from './lumpIconScrolling';

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

function makeLumpIcon(lumpType: LumpType, scale?:number) {
    let background = '';
    let scaling = scale !== undefined ? `scale:${scale}; transform-origin:top left;` : '';
    switch(lumpType) {
        case 'normal':      background = 'background-position: -1392px -672px;'; break;
        case 'bifurcated':  background = 'background-position: -1392px -720px;'; break;
        case 'golden':
            if(preferences.display.useMatureGoldenLumpSprite) {
                background = 'background-position: -1392px -768px;';
            } else {
                background = 'background-position: -1344px -768px;';
            }
            break;
        case 'meaty':       background = 'background-position: -1392px -816px;'; break;
        case 'caramelized': background = 'background-position: -1392px -1296px;'; break;
    }
    let str = `<div class="icon" style="vertical-align: middle; margin:0; ${background} ${scaling}"></div>`;
    if(scale === undefined) {
        return str;
    } else {
        // Need to wrap the icon in another div, because scale:0.5 does not change width/height
        return `<div style="width:${Math.round(48*scale)}px; height:${Math.round(48*scale)}px">
            ${str}
        </div>`;
    }
}

// Builds a string that displays the discrepancy and the current lump type.
export function discrepancyTooltip() {
    /* The bunch of if-elses here is trying to remind the user about the peculiarities of the mod.
     * and guide them about what to do.
     */
    let str = '';
    let lumpType = currentLumpType();

    if(lumpType == 'unknown') {
        str += `<div>The mod Choose Your Own Lump does not know about this lump type.
            You might be in a future version of Cookie Clicker that adds lump types,
            or using a mod which adds lump types,
            or something is wrong with your save file.
        </div>`;
    } else {
        str += `<div style="display:flex; justify-content:center; align-items:center;">
            <div>The sugar lump that is growing now is</div>
            ${makeLumpIcon(lumpType, 0.5)}
            <div>${lumpType}.</div>
        </div>`;
    }

    let genericInstructions = `
        Adjust your game state according to one of the predictions below,
        export your save file,
        <mark style="all:unset; color:white">wait for the lump to fall offline</mark>
        (i.e. be harvested automatically while the game is closed),
        and then load the save file.
    `;

    if(!discrepancyInfo.available) {
        str += `<div style="color:gray">
            No discrepancy information to show. ${genericInstructions}
        </div>`;
        return str;
    }

    if(discrepancyInfo.current.lumpT == discrepancyInfo.previous.lumpT) {
        str += `<div style="color:gray">
            No lump was harvested offline since this save file was created. ${genericInstructions}
        </div>`;
        return str;
    }

    let theoreticalLumpT = discrepancyInfo.previous.lumpT + discrepancyInfo.previous.lumpOverripeAge;
    let discrepancy = discrepancyInfo.current.lumpT - theoreticalLumpT;

    if(discrepancy == discrepancyInfo.expectedDiscrepancy) {
        str += `<div style="display:flex; justify-content:center">
            <div>
                The discrepancy was <mark style="all:unset; color:green">${discrepancy}ms</mark>,
                exactly what we expected!
            </div>
        </div>`;
        return str;
    }

    let errorMessage = `
        The actual discrepancy was <mark style="all:unset; color:red">${discrepancy}ms</mark>,
        which differs from the expected discrepancy of ${discrepancyInfo.expectedDiscrepancy}ms.
    `;

    if(discrepancy >= 0 && discrepancy <= 1000) {
        // Hopefully a reasonable range of "naturally occuring discrepancies"
        str += `<div>${errorMessage}
            Try loading the save again if the lump does not have the desired type.
        </div>
        <div style="font-size:smaller">
            (If the actual discrepancy is frequently ${discrepancy}ms,
            you can try changing the "expected discrepancy" setting in the options menu to ${discrepancy}ms.
            In future predictions,
            Choose Your Own Lump will assume that this is the discrepancy that will take place.)
        </div>`;
        return str;
    }

    let discrepancyMinutes = discrepancy / (60 * 1000);
    if(discrepancyMinutes > 10 && discrepancyMinutes < 70) {
        str += `<div>${errorMessage}</div>
            <div>This most likely happened because the pantheon
                (the Temples minigame)
                has had not finished loading when the lump times were computed,
                so Rigidel did not have an effect on lump maturation times. `;
        if(Game.hasGod) {
            str += `Try importing your save file again, now that the pantheon has loaded.`;
        } else {
            str += `
                Unlock the pantheon by spending a sugar lump in the temples,
                and import your save file again.
            `;
        }
        str += '</div>';
        return str;
    }

    if(discrepancy > 0.99 * discrepancyInfo.previous.lumpOverripeAge) {
        str += `<div>${errorMessage}</div>
            <div>
                More than one lump was autoharvested since this save file was created.
                Other than the first,
                all lumps autoharvested offline are normal,
                so there is nothing we can do.
            </div>
            <div>${genericInstructions}</div>
        `;
        // The generic message here is to help players that may have been returning after a while
        return str;
    }

    str += `<div>${errorMessage}
        <mark style="all:unset; color:red">Something went wrong.</mark>
        Try loading your save again and without other mods.
        If the problem persists,
        please contact the developers of Choose Your Own Lump.
    </div>`
    return str;
}

/* Returns a <div> displaying either a checkmark, a warning sign, or nothing.
 * The div's position will be absolute and at the top right.
 */
function makeNote(note: '' | 'checkmark' | 'warn') {
    let noteCharacter = '', noteColor = '';
    if(preferences.display.showCheckmark) {
        if(note == 'checkmark') {
            noteCharacter = '✔';
            noteColor = 'color:darkgreen;';
        }
        if(note == 'warn') {
            noteCharacter = '⚠️';
        }
    }
    return `<div style="position:absolute; top:0px; right:0px; ${noteColor}">${noteCharacter}</div>`;
}

/* Returns a string for a <div> tag that displays the given dragon aura icon. */
function makeDragonAuraIcon(dragonAura: DragonAuraReportEntry) {
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
    let dragonDiv = '<div class="icon" style="vertical-align: middle; margin:0 -2px;' + background + transparency + '"></div>';

    return '<div style="height: 48px; position:relative; display:inline-block; vertical-align:middle;">' + dragonDiv + makeNote(dragonAura.note) + '</div>';
}

/* Returns a string for a <div> tag that displays the given grandma icon.
 * "stage == 0" forces the icon to be placed in the top left corner;
 * "stage == 1" forces the icon to be placed in the top right corner;
 * "stage == 2" forces the icon to be placed in the bottom left corner;
 * "stage == 3" forces the icon to be placed in the bottom right corner.
 */
function makeGrandmaIcon(stage: number, transparent: boolean) {
    let transparency = transparent ? 'opacity: 0.2;' : '';
    let position = 'position:absolute;';
    let background = `background-image:url(${Game.resPath}img/buildings.png); `;
    if(stage == 0) { background += 'background-position: 0px -64px;';     position += 'top: 0px; left: 0px;';}
    if(stage == 1) { background += 'background-position: 0px -128px;';    position += 'top: 0px; right: 0px;';}
    if(stage == 2) { background += 'background-position: -64px -128px;';  position += 'bottom: 0px; left: 0px;';}
    if(stage == 3) { background += 'background-position: -128px -128px;'; position += 'bottom: 0px; right: 0px;';}
    // The grandma icons are 64x64 pixels, but the 6 rightmost pixel columns are mostly blank
    return `<div style="width:58px; height:64px; display:inline-block; ${background} ${transparency} ${position}"></div>`;
}

function makeGrandmapocalypseIcons(grandmapocalypseStages: [boolean, boolean, boolean, boolean], note: '' | 'checkmark') {
    function noteForStage(stage: number) { // Used only in the non-compact representation
        let currentStage = Game.elderWrath;
        let mark = (currentStage == stage && grandmapocalypseStages[stage]) ? 'checkmark' as const: '' as const;
        return makeNote(mark).replace('darkgreen', 'green'); // Checkmark needs to be slighly lighter
    }
    if(preferences.display.compactGrandmapocalypseRepresentation) {
        /* For the compact representation, we make use of the note.
         * We make the div a little bit wider than 58px
         * so that the note is not displayed on top of the top right picture
         * (which is grandmapocalypse stage 1),
         * which might seem to players to mean that
         * the checkmark belongs to that specific grandmapocalypse stage
         * rather than the "whole block".
         */
        return `<div style="position:relative; width:66px; height:64px">
            <div style="width: 116px; height: 128px; transform:scale(0.5); transform-origin:top left;">
                ${makeGrandmaIcon(0, !grandmapocalypseStages[0])}
                ${makeGrandmaIcon(1, !grandmapocalypseStages[1])}
                ${makeGrandmaIcon(2, !grandmapocalypseStages[2])}
                ${makeGrandmaIcon(3, !grandmapocalypseStages[3])}
            </div>
            ${makeNote(note) /* Use single note in this case */}
        </div>`;
    } else {
        // We ignore the report's note in this case and provide our own.
        return `<div style="display:flex; width:232px; height:64px">
            <div style = "width:58px; height:64px; position:relative;">${makeGrandmaIcon(0, !grandmapocalypseStages[0])} ${noteForStage(0)}</div>
            <div style = "width:58px; height:64px; position:relative;">${makeGrandmaIcon(1, !grandmapocalypseStages[1])} ${noteForStage(1)}</div>
            <div style = "width:58px; height:64px; position:relative;">${makeGrandmaIcon(2, !grandmapocalypseStages[2])} ${noteForStage(2)}</div>
            <div style = "width:58px; height:64px; position:relative;">${makeGrandmaIcon(3, !grandmapocalypseStages[3])} ${noteForStage(3)}</div>
        </div>`;
    }
}

/* Similar as above, but builds a Rigidel with a pantheon icon instead.
 * If the slot is 'none', Rigidel will be faded and the div will have height of 48px.
 * Otherwise, the div has height of 60px.
 */
function makeRigidelIcon(slot: PantheonSlot, note: 'checkmark' | 'warn' | '') {
    let rigidel = '<div class="icon" style="background-position:-1056px -912px; margin:0"></div>';
    let gem_background = '';
    switch(slot) {
        case 'diamond': gem_background = 'background-position: -1104px -720px;'; break;
        case 'ruby':    gem_background = 'background-position: -1128px -720px;'; break;
        case 'jade':    gem_background = 'background-position: -1104px -744px;'; break;
    }
    let gem = '<div class="icon" style="width:24px; height:24px; position:absolute; top:36px; left:12px; margin:0;' + gem_background + '"></div>';
    if(slot == 'none') gem = '';

    let height = slot == 'none' ? 'height:48px;' : 'height:60px';
    return `<div style="${height} width:48px; position:relative">
        <div style="${slot == 'none' ? 'opacity:0.2' : ''}">${rigidel}${gem}</div>
        ${makeNote(note)}
    </div>`;
}

export function makeConfigurationDiv(entry: PlannerReportEntry) {
    let str = '<div style="display:flex; align-items:center">';
    if(entry.grandmaCount !== null) {
        str += `<div style="display:flex; flex-direction:column; align-items:center; width:40px; height:64px; position:relative">
            <div style="background-image:url(${Game.resPath}img/grandma.png); background-position:bottom; width:40px; height:52px;"></div>
            ${entry.grandmaCount == 600 ? '600+' : entry.grandmaCount}
            ${makeNote(entry.grandmaCountNote)}
        </div>`;
    }

    str += makeGrandmapocalypseIcons(entry.grandmapocalypseStages, entry.grandmapocalypseNote);

    for(let dragonAura of entry.dragonAuras) {
        str += makeDragonAuraIcon(dragonAura);
    }
    str += makeRigidelIcon(entry.rigidelSlot, entry.rigidelNote);
    return str + '</div>';
}

// Constructs the summary report list
export function makeSummaryReport(report: SummaryPlannerReport) {
    let str = '';
    let hasShownLumpType = false;
    for(let lumpType of ['normal', 'bifurcated', 'golden', 'meaty', 'caramelized'] as LumpType[]) {
        if(report[lumpType] === undefined) continue;
        hasShownLumpType = true;

        let anySelected = report[lumpType].some(x => x.selectedEntry);
        str += `<div style="display:flex; align-items:center; margin:2px; padding:2px; border: solid 2px; border-color:${anySelected ? 'darkblue' : 'dimgray'}; border-radius: 5px;">`;

        str += `<div style="display:flex; align-items:center; margin:1ex">
            ${makeLumpIcon(lumpType, 0.5)}
            <div style="width:12ex; margin:0.5ex;">${lumpType[0].toUpperCase() + lumpType.substring(1)}</div>
        </div>`;

        str += `<div style="display:flex; flex-direction:column;">`;
        for(let configuration of report[lumpType]) {
            str += `<div style="padding:2px; ${configuration.selectedEntry ? 'background-color:midnightblue' : ''}">
                ${makeConfigurationDiv(configuration)}
            </div>`;
        }
        if(report[lumpType].length == 0) {
            if(Game.Has('Sugar aging process')) {
                str += `<div>
                    This seems to be an unlucky seed.
                    Try making your requirements less strict in the options menu!
                </div>`;
            } else {
                str += `<div>
                    No matching predictions found.
                    This report type is better suited
                    for after you have purchased the heavenly upgrade "Sugar aging process".
                </div>`;
            }
        }
        str += '</div>';

        str += '</div>';
    }

    if(!hasShownLumpType) {
        str += 'No lump types were chosen, please select at least one lump type in the options menu.';
    }

    return str;
}

// Constructs a fancy table of predictions
export function makeFullListReport(report: FullListPlannerReport) {
    let configurationCount = report.flat().length;

    // The +1 ensures we display the "no other predictions found" text if the player scrolls too far
    capScrolledRows(configurationCount - preferences.display.rows + 1);
    let displayedRows = 0;
    let iteratedRows = 0;
    let str = '';
    str += '<div style="display:flex; flex-direction:column;">';

outerLoop:
    for(let i = 0; i < report.length; i++) {
        for(let j = 0; j < report[i].length; j++) {
            iteratedRows++;
            if(iteratedRows <= scrolledRows) continue;
            let background = i % 2 ? '' : 'background-color: black;';
            if(report[i][j].selectedEntry) background = 'background-color: midnightblue;';
            str += `<div style="display:flex; align-items:center; justify-content:center; padding:2px; ${background}">`;
            str += makeLumpIcon(report[i][j].lumpType);
            str += '<div style="margin-right:1.5ex">:</div>';
            str += makeConfigurationDiv(report[i][j]);
            str += '</div>';
            displayedRows++;
            if(displayedRows >= preferences.display.rows) {
                break outerLoop;
            }
        }
    }

    if(displayedRows < preferences.display.rows) {
        str += '<div padding=2px; margin=5px; align-text: right;">No other matching predictions found.';
        if(displayedRows == 0) {
            if(Game.Has('Sugar aging process')) {
                str += `<br />
                    This seems to be an unlucky seed.
                    Try making your requirements less strict in the options menu!
                `;
            } else {
                str += `<br />
                    Try showing more lump types and making your requirements less strict in the options menu.
                    Also, get the heavenly upgrade "Sugar aging process".
                `;
            }
        }
        str += '</div>';
    }

    str += '</div>';
    return str;
}

/* This function is pushed to CCSE's `Game.customLumpTooltip` on init by main.ts.
 */
export function customLumpTooltip(str: string, _phase: number) {
    // TODO There has to be a better way of doing this
    let calculatedWidth = 0;
    calculatedWidth += 40; // Grandma icon
    if(preferences.display.compactGrandmapocalypseRepresentation) {
        calculatedWidth += 58;
    } else {
        calculatedWidth += 58 * 4;
    }
    if(preferences.filtering.threeColumnDragonAuras) {
        calculatedWidth += 44 * 3;
    } else {
        calculatedWidth += 44 * 2;
    }
    calculatedWidth += 48; // Rigidel icon

    if(preferences.display.reportType == 'summary') {
        calculatedWidth += 120; // Approximate
    } else {
        calculatedWidth += 54;
    }
    calculatedWidth += 20; // Some extra leeway

    if(calculatedWidth > 400) {
        str = str.replace('width:400px',`width:${calculatedWidth}px`); // Kludge; widens the tooltip box
    }

    str += '<div class="line"></div>';

    str += discrepancyTooltip();
    str += '<div class="line"></div>';

    // Next lump type
    let prediction, isCurrent;
    ({ prediction, isCurrent } = planner.getAndUpdateLumpTypePrediction());
    /* "recalculating" div having zero width ensures the alignment does not change by its presence.
     * "padding-right" then needs to be on the previous div,
     * as padding/margin on the "recalculating" div would make it not zero-width anymore.
     * (Note that flexbox ignores spaces, so adding a leading space to "(recalculating...)" does not work.)
     */
    str += `<div style="display:flex; justify-content:center; align-items:center;">
        <div>The next lump type is predicted to be</div>
        ${makeLumpIcon(prediction, 0.5)}
        <div style="padding-right:0.5ex">${prediction}.</div>
        ${isCurrent? '' : '<div style="width: 0px;">(recalculating...)</div>'}
    </div>`;

    let reportStr = '';
    if(preferences.display.reportType == 'summary') {
        let report;
        ({ report, isCurrent } = planner.getAndUpdateSummaryReport());
        reportStr = makeSummaryReport(report);
    } else {
        let report;
        ({ report, isCurrent } = planner.getAndUpdateFullListReport());
        reportStr = makeFullListReport(report);
    }

    str += `<div style="display:flex; justify-content:center; margin-bottom:4px;">
        <div style="padding-right:0.5ex">Other configurations:</div>
        ${isCurrent? '' : '<div style="width: 0px;">(recalculating...)</div>'}
    </div>`;
    str += reportStr;

    return str;
}
