import { TransientState } from '../transientState';
import { settings, effectiveDiscrepancy, targetTypes } from './settings';
import { makeIcon, makeGrandmaIcon, makeRigidelIcon } from './icons';
import { currentLumpType, currentRigidelSlot } from './util';
import { previousAutoharvestTime, previousLumpT, warnPantheonNotLoaded } from './preAutoharvestDataRetrieval';
import { computePredictions, cachedPredictions } from './predictionsCache';
import { predictNextLumpType } from '../util';

// Builds a string that displays the discrepancy and the current lump type.
export function discrepancyTooltip() {
    /* The bunch of if-elses here is trying to remind the user about the peculiarities of the mod.
     * For example,
     * if previousLumpT === Game.lumpT,
     * no lumps were harvested between saving and loading the game,
     * so this function tries to remind the user to load the save game
     * only after a lump is autoharvested.
     *
     * Another example: if the actual discrepancy differs from effectiveDiscrepancy(),
     * then the lump type is probably not what the user wanted,
     * so there is a reminder to try to reload the game again.
     * (This is also the reason why the current lump type is shown here.)
     */
    let str = '<div>Expected discrepancy: ' + effectiveDiscrepancy() + 'ms.</div>';
    str += '<div>Current lump type: ' + makeIcon('lump_' + currentLumpType()) +
        ' ' + currentLumpType() + '.</div>';

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
            if(discrepancy === effectiveDiscrepancy()) {
                str += '<div style="display:inline; color:green">' + discrepancy + ' milliseconds</div>,';
                str += ' precisely what we expected!<br />';
            } else {
                str += '<div style="display:inline; color:red">' + discrepancy + ' milliseconds</div>,';
                if(discrepancy < effectiveDiscrepancy())
                    str += ' less than what we expected.';
                else
                    str += ' more than what we expected.';
            }
            if(discrepancy !== effectiveDiscrepancy())
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

/* Decides whether the given prediction is desirable
 * based on current user preferences.
 */
export function isDesirablePrediction(
    prediction: TransientState,
    additionalGrandmapocalypseStages: boolean[]
) {
    if(targetTypes().indexOf(prediction.lumpType!) === -1) return false;
    let current = TransientState.current();
    if(settings.preserveGrandmapocalypseStage) {
        if(!additionalGrandmapocalypseStages[current.grandmapocalypseStage])
            return false;
    }
    if(settings.preserveDragon) {
        if(!current.dragon.equal(prediction.dragon))
            return false;
    }

    // Last thing: the pantheon
    if(settings.preservePantheon) {
        if(prediction.rigidelSlot === 0) return true;
        // If CYOL.TransientState.init generated 'prediction' with a slotted Rigidel,
        // then we absolutely need it.
        let currentSlot = currentRigidelSlot();
        // We cannot use current.rigidelSlot because it considers inactive Rigidel as slot 0
        if(!prediction.grandmaCount) return currentSlot === prediction.rigidelSlot;

        let extraGrandmas = 200*(prediction.rigidelSlot - currentSlot); // make up the difference
        return prediction.grandmaCount + extraGrandmas <= 600
            && prediction.grandmaCount + extraGrandmas >= 0;
    }

    // Passed all tests!
    return true;
}

// Constructs a fancy table of predictions
export function predictionTable() {
    computePredictions();
    let str = '';
    let rows = 0, i = 0;
    while(rows < settings.rowsToDisplay && i < cachedPredictions!.length) {
        let grandmapocalypseStages = [false, false, false, false];
        let prediction = cachedPredictions![i];
        while(prediction.almostEqual(cachedPredictions![i])) {
            grandmapocalypseStages[cachedPredictions![i].grandmapocalypseStage] = true;
            i++;
        }

        if(!isDesirablePrediction(prediction, grandmapocalypseStages)) {
            continue;
        } else {
            rows++; // This is a valid row
        }

        str += makeIcon('lump_' + prediction.lumpType) + ':';
        if(prediction.grandmaCount) {
            str += '<div style="width: 5ex; display: inline-block; vertical-align:middle; text-align:right; margin-right:5px;">' + prediction.grandmaCount + 'x</div>';
        } else {
            str += '&nbsp;&nbsp;&nbsp;'; // kludge
        }
        str += makeGrandmaIcon('appeased', !grandmapocalypseStages[0]);
        str += makeGrandmaIcon('awoken', !grandmapocalypseStages[1]);
        str += makeGrandmaIcon('displeased', !grandmapocalypseStages[2]);
        str += makeGrandmaIcon('angered', !grandmapocalypseStages[3]);
        str += makeIcon('aura_dragons_curve', !prediction.dragon.hasDragonsCurve);
        str += makeIcon('aura_reality_bending', !prediction.dragon.hasRealityBending);
        str += makeRigidelIcon(prediction.rigidelSlot);
        str += '<br />';
    }
    if(rows < settings.rowsToDisplay) {
        str += 'No other matching predictions found.';
        if(rows === 0) {
            str += '<br />Try displaying more lump types in the settings!';
        }
    }
    return str;
}

export function customLumpTooltip(str: string, _phase: number) {
    computePredictions();
    str = str.replace('width:400px','width:475px'); // FIXME kludge; widens the tooltip box
    str += '<div class="line"></div>';

    str += discrepancyTooltip();
    str += '<div class="line"></div>';

    // Next lump type
    let type = predictNextLumpType(effectiveDiscrepancy());
    str += 'Predicted next lump type: ' + makeIcon('lump_' + type) + ' ' + type + '.';
    if(Game.hasGod && Game.BuildingsOwned%10!==0 && Game.hasGod('order')) {
        str += ' Rigidel not active!';
    }
    str += '<br />';

    str += 'Predictions: <br />';
    str += predictionTable();
    return str;
}
