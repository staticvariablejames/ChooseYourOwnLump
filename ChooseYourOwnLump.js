// SPDX-License-Identifier: GPL-3.0-or-later

var CYOL = {};
// 'var' used here to avoid syntax errors if this script is loaded more than once
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// CCSE calls Game.Win('Third-party') for us

// CYOL.launch is at the end of this file.
CYOL.name = "Choose Your Own Lump";
CYOL.version = "1.1.5"; // Semantic versioning
CYOL.GameVersion = "2.029";
CYOL.CCSEVersion = "2.017";

CYOL.DragonAuras = class {
    /* This class accounts for how the game handles the dragon's auras.
     *
     * In the end,
     * it is just a fancy way of enumerating the numbers 0, 0.1, 1, 1.1,
     * but with some fancy pretty-printing :)
     */
    constructor(hasDragonsCurve, hasRealityBending) {
        this.hasDragonsCurve = hasDragonsCurve;
        this.hasRealityBending = hasRealityBending;
    }
    toString() {
        if(this.hasDragonsCurve && this.hasRealityBending)
            return "both Dragon's Curve and Reality Bending on the dragon";
        else if(this.hasDragonsCurve)
            return "only Dragon's Curve on the dragon";
        else if(this.hasRealityBending)
            return "only Reality Bending on the dragon";
        else
            return "neither Dragon's Curve nor Reality Bending on the dragon";
    }
    auraValue() {
        return (this.hasDragonsCurve? 1 : 0) + (this.hasRealityBending? 0.1 : 0);
    }
    equal(dragon) {
        return dragon instanceof CYOL.DragonAuras
            && this.hasDragonsCurve === dragon.hasDragonsCurve
            && this.hasRealityBending === dragon.hasRealityBending;
    }
    static fromGame() {
        // Return the DragonAuras corresponding to the current in-game state.
        return new CYOL.DragonAuras(Game.hasAura("Dragon's Curve"), Game.hasAura("Reality Bending"));
    }

    /* Makeshift enum!
     * All kinds of auras will be iterable via
     *  for(dragon of DragonAuras.all) {...}
     */
    static bothAuras = undefined;
    static onlyDragonsCurve = undefined;
    static onlyRealityBending = undefined;
    static neitherAuras = undefined;
    static all = undefined;
    static init() {
        // init() is called by CYOL.launch()
        this.bothAuras = new this(true, true);
        this.onlyDragonsCurve = new this(true, false);
        this.onlyRealityBending = new this(false, true);
        this.neitherAuras = new this(false, false);
        this.all = [this.neitherAuras, this.onlyRealityBending, this.onlyDragonsCurve, this.bothAuras];
    }
}

/* Atttributes from the game that affect lump maturation time
 * which can be easily modified by the player.
 */
CYOL.TransientState = class {
    /* grandmapocalypseStage is a number between 0 and 3,
     * dragon is an object of CYOL.DragonAuras,
     * rigidelSlot===0 means unslotted, 1 means Jade, 2 means Ruby, 3 means Diamond
     * (note that this is a different convention than the one used in minigamePantheon.js);
     * grandmaCount is the number of grandmas.
     *
     * For ease of use,
     * CYOL.PersistentState.prototype.predictLumpType (and related method)
     * inject the properties 'lumpType' and 'autoharvestTime' into objects of this class.
     */
    constructor(grandmapocalypseStage, dragon, rigidelSlot, grandmaCount) {
        this.grandmapocalypseStage = grandmapocalypseStage;
        this.dragon = dragon;
        this.rigidelSlot = rigidelSlot;
        this.grandmaCount = grandmaCount;
    }

    /* True if the only difference between the two states is the grandmapocalypseStage. */
    almostEqual(state) {
        return state instanceof CYOL.TransientState
            && this.dragon.equal(state.dragon)
            && this.rigidelSlot === state.rigidelSlot
            && this.grandmaCount === state.grandmaCount
            && this.lumpType === state.lumpType;
    }

    // Returns the current state of the game.
    static current() {
        let dragon = CYOL.DragonAuras.fromGame();
        let grandmapocalypseStage = Game.elderWrath;
        let rigidelSlot = 0;
        if (Game.hasGod && Game.BuildingsOwned%10==0 && Game.hasGod('order'))
            rigidelSlot = 4 - Game.hasGod('order');

        let grandmaCount = Game.Objects['Grandma'].amount;
        return new this(grandmapocalypseStage, dragon, rigidelSlot, grandmaCount);
    }

    static grandmalessStates = undefined; // All possible states without grandmas
    static grandmafulStates = undefined; // All possible (inequivalent) states with grandmas
    /* States which differ only in their grandmapocalypseStage are generated together.
     * This guarantees that they are grouped when sorting by autoharvestTime,
     * as Array.prototype.sort is stable. */
    static init() {
        // init() is called by CYOL.launch()
        this.grandmalessStates = [];
        this.grandmafulStates = [];

        for(let dragon of CYOL.DragonAuras.all) {
            for(let rigidelSlot = 0; rigidelSlot <= 3; rigidelSlot++) {
                for(let gStage = 0; gStage <= 3; gStage++) {
                    this.grandmalessStates.push(new this(
                        gStage, dragon, rigidelSlot
                    ));
                }
                let grandmaCount = (rigidelSlot === 0 ? 0 : 401);
                /* Having n grandmas with Rigidel in slot k
                 * is the same thing as having n+200 grandmas with Rigidel in slot k-1.
                 * The condition above prevents equivalent configurations from being generated.
                 * It favors using grandmas instead of Rigidel;
                 * the idea is to maximize the usefulness of the pantheon
                 * for uses beyond this trick. */
                for(; grandmaCount <= 600; grandmaCount++) {
                    for(let gStage = 0; gStage <= 3; gStage++) {
                        this.grandmafulStates.push(new this(
                            gStage, dragon, rigidelSlot, grandmaCount
                        ));
                    }
                }
            }
        }
    }
}

/* Attributes from the game that are not easily modifiable by the player,
 * like having certain upgrades.
 */
CYOL.PersistentState = class {
    constructor(seed, lumpT, hasSteviaCaelestis, hasSucralosiaInutilis, hasSugarAgingProcess) {
        this.seed = seed; // Corresponds to Game.seed
        this.lumpT = lumpT; // Time that the current lump type started coalescing
        this.hasSteviaCaelestis = hasSteviaCaelestis;
        this.hasSucralosiaInutilis = hasSucralosiaInutilis;
        this.hasSugarAgingProcess = hasSugarAgingProcess;
    }

    /* Computes the predictions for all compatible transient states. */
    allPredictions(discrepancy) {
        let states = this.hasSugarAgingProcess? CYOL.TransientState.grandmafulStates : CYOL.TransientState.grandmalessStates;
        for(let state of states) {
            this.predictLumpType(state, discrepancy);
        }
        states.sort((state1, state2) => state1.autoharvestTime - state2.autoharvestTime);
        return states;
    }

    /* Computes the lump type for the given transient state.
     * The lump type and autoharvest times are stored in the transient state
     * as the attributes lumpType and autoharvestTime, respectively.
     */
    predictLumpType(transientState, discrepancy, verbose) {
        discrepancy = Number(discrepancy); // Just to be sure
        let ripeAge = 23 * 60*60*1000; // 23 hours
        if (this.hasSteviaCaelestis) ripeAge -= 60*60*1000;
        if (this.hasSugarAgingProcess) ripeAge -= 6*1000 * Math.min(transientState.grandmaCount, 600);
        ripeAge -= 20*60*1000 * transientState.rigidelSlot;
        ripeAge /= 1 + 0.05*transientState.dragon.auraValue();
        let autoharvestTime = Math.floor(this.lumpT) + ripeAge + 60*60*1000 + discrepancy;
        /* This technique for choosing the lump type
         * only really works if we save the game and load it _after_ the autoharvest time.
         * However, although the game works just fine using fractional Game.lumpT values,
         * the game truncates the number when saving.
         * Thus we must assume that we have the truncated number here.
         */

        Math.seedrandom(this.seed+'/'+autoharvestTime);

        let types=['normal'];
        let loop = 1 + randomFloor(transientState.dragon.auraValue());
        for (let i=0; i<loop; i++) {
            if (Math.random()<(this.hasSucralosiaInutilis?0.15:0.1)) types.push('bifurcated');
            if (Math.random()<3/1000) types.push('golden');
            if (Math.random()<0.1*transientState.grandmapocalypseStage) types.push('meaty');
            if (Math.random()<1/50) types.push('caramelized');
        }
        let lumpType = choose(types);
        Math.seedrandom();

        if(verbose) console.log("Predicted type: " + lumpType + ", ripe age: " + ripeAge + ", autoharvest time: " + autoharvestTime);
        transientState.lumpType = lumpType;
        transientState.autoharvestTime = autoharvestTime;

        return lumpType;
    }

    /* Determine whether the two states are equal. */
    equal(state) {
        return state instanceof CYOL.PersistentState
            && state.seed === this.seed
            && state.lumpT === this.lumpT
            && state.hasSteviaCaelestis === this.hasSteviaCaelestis
            && state.hasSucralosiaInutilis === this.hasSucralosiaInutilis
            && state.hasSugarAgingProcess === this.hasSugarAgingProcess
            ;
    }

    // The current state of the game
    static current() {
        let seed = Game.seed;
        let lumpT = Game.lumpT;
        let hasSteviaCaelestis = Game.Has('Stevia Caelestis');
        let hasSucralosiaInutilis = Game.Has('Sucralosia Inutilis');
        let hasSugarAgingProcess = Game.Has('Sugar aging process');
        return new this(seed, lumpT, hasSteviaCaelestis, hasSucralosiaInutilis, hasSugarAgingProcess);
    }
}

/* Stringify the prediction state in a readable way. */
CYOL.formatPredictionState = function(transientState, discrepancy) {
    let str = "Lump type: " + transientState.lumpType + ", with ";
    if(transientState.grandmaCount !== undefined) str += transientState.grandmaCount + " ";
    if(transientState.grandmapocalypseStage == 0) str += "appeased grandmas, ";
    if(transientState.grandmapocalypseStage == 1) str += "awoken grandmas, ";
    if(transientState.grandmapocalypseStage == 2) str += "displeased grandmas, ";
    if(transientState.grandmapocalypseStage == 3) str += "angered grandmas, ";

    str += transientState.dragon + ", ";

    if(transientState.rigidelSlot == 0) str += "Rigidel unslotted,";
    if(transientState.rigidelSlot == 1) str += "Rigidel on Jade slot,";
    if(transientState.rigidelSlot == 2) str += "Rigidel on Ruby slot,";
    if(transientState.rigidelSlot == 3) str += "Rigidel on Diamond slot,";

    str += " and " + discrepancy + " of discrepancy.";

    return str;
}

CYOL.predictNextLumpType = function(discrepancy, verbose) {
    if(discrepancy === undefined) {
        throw new Error("Missing discrepancy parameter");
    }

    let transientState = CYOL.TransientState.current();
    let persistentState = CYOL.PersistentState.current();
    return persistentState.predictLumpType(transientState, discrepancy, verbose);
}

/* Injects or modifies the function with the given name.
 * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
 */
CYOL.rewriteCode = function(functionName, pattern, replacement) {
    let code = eval(functionName + ".toString()");
    let newCode = code.replace(pattern, replacement);
    eval(functionName + " = " + newCode);
}

CYOL.UI = {};

CYOL.UI.settings = { // default settings
    discrepancy: 1,
    includeNormal: false,
    includeBifurcated: false,
    includeGolden: true,
    includeCaramelized: false,
    rowsToDisplay: 10,
};

/* Copies the given settings object to CYOL.UI.settings,
 * enforcing that the objects have their appropriate types.
 */
CYOL.UI.copySettings = function(settings) {
    if(!settings) return;
    let numericSettings = ['discrepancy', 'rowsToDisplay'];
    let booleanSettings = ['includeNormal', 'includeBifurcated', 'includeGolden', 'includeCaramelized'];

    for(key of numericSettings) {
        if(key in settings) CYOL.UI.settings[key] = Number(settings[key]);
    }
    for(key of booleanSettings) {
        if(key in settings) CYOL.UI.settings[key] = Boolean(settings[key]);
    }
}

CYOL.UI.targetTypes = function() {
    let types = [];
    if(CYOL.UI.settings.includeNormal) types.push('normal');
    if(CYOL.UI.settings.includeBifurcated) types.push('bifurcated');
    if(CYOL.UI.settings.includeGolden) types.push('golden');
    if(CYOL.UI.settings.includeMeaty) types.push('meaty');
    if(CYOL.UI.settings.includeCaramelized) types.push('caramelized');
    return types;
}

CYOL.UI.cachedPredictions = null;
CYOL.UI.cachedState = null; // the PersistentState that was used to compute cachedPredictions

/* Recomputes cachedPredictions if cachedState differs from the current state,
 * or if cachedPredictions === null. */
CYOL.UI.computePredictions = function() {
    let currentState = CYOL.PersistentState.current();
    if(currentState.equal(CYOL.UI.cachedState) && CYOL.UI.cachedPredictions !== null) return;
    CYOL.UI.cachedState = currentState;
    CYOL.UI.cachedPredictions = currentState.allPredictions(CYOL.UI.settings.discrepancy);
}

/* In CYOL.init(),
 * a call to sneakySaveDataRetrieval is injected right before the new lump type is calculated.
 * This allows us to display the actual value of discrepancy to the user.
 */
CYOL.UI.previousAutoharvestTime = null;
CYOL.UI.previousLumpT = null;
/* It seems that, in rare cases,
 * the game might try to loadLumps before all minigames have finished loading.
 * This means that the bonus from Rigidel cannot be computed
 * and is simply skipped.
 * So we warn the player about this issue in the lump tooltip.
 */
CYOL.UI.warnPantheonNotLoaded = false;
CYOL.UI.sneakySaveDataRetrieval = function() {
    CYOL.UI.previousLumpT = Game.lumpT;
    CYOL.UI.previousAutoharvestTime = Game.lumpT + Game.lumpOverripeAge;
    CYOL.UI.warnPantheonNotLoaded = !Game.hasGod;
}

/* Returns a string for a <div> tag that displays the given icon. */
CYOL.UI.makeIcon = function(icon, transparent) {
    let transparency = '';
    let background = '';
    if(icon === 'lump_normal') background += 'background-position: -1392px -672px;';
    if(icon === 'lump_bifurcated') background += 'background-position: -1392px -720px;';
    if(icon === 'lump_golden') background += 'background-position: -1344px -768px;';
    if(icon === 'lump_meaty') background += 'background-position: -1392px -816px;';
    if(icon === 'lump_caramelized') background += 'background-position: -1392px -1296px;';
    if(icon === 'aura_dragons_curve') background += 'background-position: -960px -1200px;';
    if(icon === 'aura_reality_bending') background += 'background-position: -1536px -1200px;';
    if(icon === 'none') background += 'background-position:48px 48px;';
    if(transparent) transparency += 'opacity: 0.2;';
    return '<div class="icon" style="vertical-align: middle; margin: 0 -4px;' + background + transparency + '"></div>';
}

/* Same as above but for buildings instead. */
CYOL.UI.makeGrandmaIcon = function(type, transparent) {
    let background = "background-image: url('img/buildings.png?v=4');";
    let transparency = '';
    if(type === 'appeased') background += 'background-position: 0px -64px;';
    if(type === 'awoken') background += 'background-position: 0px -128px;';
    if(type === 'displeased') background += 'background-position: -64px -128px;';
    if(type === 'angered') background += 'background-position: -128px -128px;';
    if(transparent) transparency += 'opacity: 0.2;';
    return '<div style="display: inline-block; width:64px; height:64px; vertical-align: middle;' + background + transparency + '""></div>';
}

/* Similar as above, but builds a Rigidel with a pantheon icon instead.
 * slot === 0 means unslotted, slot === 1 means jade slot, 2 is ruby and 3 is diamond. */
CYOL.UI.makeRigidelIcon = function(slot) {
    let rigidel = '<div class="icon" style="background-position:-1056px -912px"></div>';
    let gem_background = '';
    if(slot === 3) gem_background += 'background-position: -1104px -720px;';
    if(slot === 2) gem_background += 'background-position: -1128px -720px;';
    if(slot === 1) gem_background += 'background-position: -1104px -744px;';
    if(slot === 0) gem_background += 'background-position: -1128px -744px;'; // No background
    let gem = '<div class="icon" style="width:24px;height:24px; position:absolute; top: 36px; left: 12px;' + gem_background + '"></div>';
    return '<div style="height: 60px; position:relative; display:inline-block; vertical-align:middle;' + (slot===0 ? 'opacity:0.2' : '') + '">' + rigidel + gem + '</div>';
}

CYOL.UI.currentLumpType = function() {
    switch(Game.lumpCurrentType) {
        case 0: return 'normal';
        case 1: return 'bifurcated';
        case 2: return 'golden';
        case 3: return 'meaty';
        case 4: return 'caramelized';
        default: return 'unknown';
    }
}

// Builds a string that displays the discrepancy and the current lump type.
CYOL.UI.discrepancyTooltip = function() {
    /* The bunch of if-elses here is trying to remind the user about the peculiarities of the mod.
     * For example,
     * if CYOL.UI.previousLumpT === Game.lumpT,
     * no lumps were harvested between saving and loading the game,
     * so this function tries to remind the user to load the save game
     * only after a lump is autoharvested.
     *
     * Another example: if the actual discrepancy differs from CYOL.UI.settings.discrepancy,
     * then the lump type is probably not what the user wanted,
     * so there is a reminder to try to reload the game again.
     * (This is also the reason why the current lump type is shown here.)
     */
    let str = '<div>Expected discrepancy: ' + CYOL.UI.settings.discrepancy + 'ms.</div>';
    str += '<div>The current lump type is ' + CYOL.UI.currentLumpType() + '.</div>';

    if(Game.hasGod && CYOL.UI.warnPantheonNotLoaded) {
        str += '<div style="color:red">' +
            'The Pantheon was still loading when the current lump type was computed,' +
            ' so Rigidel may have had no effect.' +
            ' Try reloading your save game again if the lump type is not the expected type.' +
            '</div>';
    }

    if(CYOL.UI.previousAutoharvestTime) {
        let discrepancy = Game.lumpT - CYOL.UI.previousAutoharvestTime;
        if(Game.lumpT === CYOL.UI.previousLumpT) {
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
            if(discrepancy === CYOL.UI.settings.discrepancy) {
                str += '<div style="display:inline; color:green">' + discrepancy + ' milliseconds</div>,';
                str += ' precisely what we expected!<br />';
            } else {
                str += '<div style="display:inline; color:red">' + discrepancy + ' milliseconds</div>,';
                if(discrepancy < CYOL.UI.settings.discrepancy)
                    str += ' less than what we expected.';
                else
                    str += ' more than what we expected.';
            }
            if(discrepancy !== CYOL.UI.settings.discrepancy)
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

CYOL.UI.customLumpTooltip = function(str, phase) {
    CYOL.UI.computePredictions();
    str = str.replace('width:400px','width:475px'); // FIXME kludge; widens the tooltip box
    str += '<div class="line"></div>';

    str += CYOL.UI.discrepancyTooltip();
    str += '<div class="line"></div>';

    // Next lump type
    let type = CYOL.predictNextLumpType(CYOL.UI.settings.discrepancy);
    str += 'Predicted next lump type: ' + CYOL.UI.makeIcon('lump_' + type) + ' ' + type + '.';
    if(Game.hasGod && Game.BuildingsOwned%10!==0 && Game.hasGod('order')) {
        str += ' Rigidel not active!';
    }
    str += '<br />';

    str += 'Predictions: <br />';
    let rows = 0, i = 0;
    while(rows < CYOL.UI.settings.rowsToDisplay && i < CYOL.UI.cachedPredictions.length) {
        let grandmapocalypseStages = [false, false, false, false];
        let prediction = CYOL.UI.cachedPredictions[i];
        while(prediction.almostEqual(CYOL.UI.cachedPredictions[i])) {
            grandmapocalypseStages[CYOL.UI.cachedPredictions[i].grandmapocalypseStage] = true;
            i++;
        }

        if(CYOL.UI.targetTypes().indexOf(prediction.lumpType) === -1) {
            continue;
        } else {
            rows++; // This is a valid row
        }

        str += CYOL.UI.makeIcon('lump_' + prediction.lumpType) + ':';
        if(prediction.grandmaCount) {
            str += '<div style="width: 5ex; display: inline-block; vertical-align:middle; text-align:right; margin-right:5px;">' + prediction.grandmaCount + 'x</div>';
        } else {
            str += '&nbsp;&nbsp;&nbsp;'; // kludge
        }
        str += CYOL.UI.makeGrandmaIcon('appeased', !grandmapocalypseStages[0]);
        str += CYOL.UI.makeGrandmaIcon('awoken', !grandmapocalypseStages[1]);
        str += CYOL.UI.makeGrandmaIcon('displeased', !grandmapocalypseStages[2]);
        str += CYOL.UI.makeGrandmaIcon('angered', !grandmapocalypseStages[3]);
        str += CYOL.UI.makeIcon('aura_dragons_curve', !prediction.dragon.hasDragonsCurve);
        str += CYOL.UI.makeIcon('aura_reality_bending', !prediction.dragon.hasRealityBending);
        str += CYOL.UI.makeRigidelIcon(prediction.rigidelSlot);
        str += '<br />';
    }
    if(rows < CYOL.UI.settings.rowsToDisplay) {
        str += 'No other matching predictions found.';
        if(rows === 0) {
            str += '<br />Try displaying more lump types in the settings!';
        }
    }
    return str;
}

CYOL.UI.discrepancyCallback = function() {
    let value = document.getElementById('CYOLdiscrepancySlider').value ?? 1;
    CYOL.UI.settings.discrepancy = value;
    document.getElementById('CYOLdiscrepancySliderRightText').innerHTML = value;
    CYOL.UI.cachedPredictions = null;
}

CYOL.UI.rowsToDisplayCallback = function() {
    let value = document.getElementById('CYOLrowsToDisplaySlider').value ?? 10;
    CYOL.UI.settings.rowsToDisplay = value;
    document.getElementById('CYOLrowsToDisplaySliderRightText').innerHTML = value;
}

CYOL.UI.toggleSettings = function(buttonId, settingsName, onText, offText) {
    CYOL.UI.settings[settingsName] = !CYOL.UI.settings[settingsName];
    let element = document.getElementById(buttonId);
    if(CYOL.UI.settings[settingsName]) {
        element.classList.remove("off");
        element.innerHTML = onText;
    } else {
        element.classList.add("off");
        element.innerHTML = offText;
    }
}

CYOL.UI.customOptionsMenu = function() {
    let menuStr = "";
    menuStr += '<div class="listing">'
        + Game.WriteSlider('CYOLdiscrepancySlider', 'Discrepancy', '[$]', () => CYOL.UI.settings.discrepancy, 'CYOL.UI.discrepancyCallback()')
        + '</div>';
    menuStr += '<div class="listing">'
        + Game.WriteSlider('CYOLrowsToDisplaySlider', 'Rows of predictions to display', '[$]', () => CYOL.UI.settings.rowsToDisplay, 'CYOL.UI.rowsToDisplayCallback()')
        + '</div>';

    function makeButton(lumpType) {
        let settingsName = "include" + lumpType[0].toUpperCase() + lumpType.slice(1);
        let buttonClass = "option" + (CYOL.UI.settings[settingsName] ? "" : " off");
        let buttonId = 'CYOLbutton' + settingsName;
        let onText = "Showing " + lumpType + " lumps";
        let offText = "Hiding " + lumpType + " lumps";
        let onclick = "CYOL.UI.toggleSettings('" + buttonId + "', '" +
            settingsName + "', '" + onText + "', '" + offText + "');" +
            "CYOL.UI.cachedPredictions = null;" +
            'PlaySound(\'snd/tick.mp3\');';
        return '<a class="' + buttonClass + '"' +
            ' id="' + buttonId + '"' +
            ' onclick="' + onclick + '">' +
            (CYOL.UI.settings[settingsName] ? onText : offText) +
            '</a>';
    }
    menuStr += '<div class="listing">';
    menuStr += makeButton('normal');
    menuStr += makeButton('bifurcated');
    menuStr += makeButton('golden');
    menuStr += makeButton('meaty');
    menuStr += makeButton('caramelized');
    menuStr += '<label>Whether to display or hide predictions resulting in the corresponding lump type</label></div>';
    CCSE.AppendCollapsibleOptionsMenu("Choose Your Own Lump", menuStr);
}

CYOL.launch = function() {
    if(!CCSE.ConfirmGameCCSEVersion(CYOL.name, CYOL.version, CYOL.GameVersion, CYOL.CCSEVersion)) {
        CYOL.isLoaded = true;
        return;
    }

    CYOL.DragonAuras.init();
    CYOL.TransientState.init();

    CCSE.customSave.push(function() {
        CCSE.save.OtherMods.CYOL = CYOL.UI.settings;
    });
    let loadSettings = function() {
        if(CCSE.save.OtherMods.CYOL) {
            CYOL.UI.copySettings(CCSE.save.OtherMods.CYOL);
        }
    }
    loadSettings();
    CCSE.customLoad.push(loadSettings);

    Game.customLumpTooltip.push(CYOL.UI.customLumpTooltip);
    Game.customOptionsMenu.push(CYOL.UI.customOptionsMenu);
    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(CYOL.name, CYOL.version);
    });

    CYOL.rewriteCode('Game.loadLumps', "Game.computeLumpTimes();", "$& CYOL.UI.sneakySaveDataRetrieval();");

    CYOL.isLoaded = true;
}

// Code copied from CCSE's documentation
if(!CYOL.isLoaded){
	if(CCSE && CCSE.isLoaded){
		CYOL.launch();
	}
	else{
		if(!CCSE) var CCSE = {};
		if(!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
		CCSE.postLoadHooks.push(CYOL.launch);
	}
}
