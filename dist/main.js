(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}((function () { 'use strict';

    /* settings.ts
     * Contains the `settings` object and utilities for querying it.
     */
    let settings = {
        discrepancy: 1,
        includeNormal: false,
        includeBifurcated: false,
        includeGolden: true,
        includeMeaty: false,
        includeCaramelized: false,
        preserveGrandmapocalypseStage: false,
        preserveDragon: false,
        preservePantheon: false,
        rowsToDisplay: 10,
    };
    /* Load settings from the given save game string.
     * enforcing that the objects have their appropriate types.
     *
     * Any nonexistent attributes are ignored.
     */
    function loadSettingsFrom(save) {
        let saveObject = JSON.parse(save);
        if (typeof saveObject !== "object")
            return;
        let newSettings;
        if ('version' in saveObject) {
            newSettings = saveObject.settings ?? {};
            // TODO: if(saveObject.version != version) announceNewVersion()
        }
        else {
            // legacy save format (1.2.7 and earlier)
            newSettings = saveObject;
        }
        let key;
        for (key in settings) {
            if (!(key in newSettings))
                continue;
            //@ts-ignore: Type 'number' is not assignable to type 'never'.
            if (typeof settings[key] == 'number')
                settings[key] = Number(newSettings[key]);
            //@ts-ignore: Type 'boolean' is not assignable to type 'never'.
            if (typeof settings[key] == 'boolean')
                settings[key] = Boolean(newSettings[key]);
        }
    }
    function exportSettings() {
        return JSON.stringify({
            version: version,
            settings: settings,
        });
    }
    /* Returns the discrepancy,
     * unless the Spiced Cookies discrepancy patch is detected,
     * in which it returns 0.
     */
    function effectiveDiscrepancy() {
        if (typeof Spice !== 'undefined' && Spice?.settings?.patchDiscrepancy)
            return 0;
        return settings.discrepancy;
    }
    function targetTypes() {
        let types = [];
        if (settings.includeNormal)
            types.push('normal');
        if (settings.includeBifurcated)
            types.push('bifurcated');
        if (settings.includeGolden)
            types.push('golden');
        if (settings.includeMeaty)
            types.push('meaty');
        if (settings.includeCaramelized)
            types.push('caramelized');
        return types;
    }

    class DragonAuras {
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
            if (this.hasDragonsCurve && this.hasRealityBending)
                return "both Dragon's Curve and Reality Bending on the dragon";
            else if (this.hasDragonsCurve)
                return "only Dragon's Curve on the dragon";
            else if (this.hasRealityBending)
                return "only Reality Bending on the dragon";
            else
                return "neither Dragon's Curve nor Reality Bending on the dragon";
        }
        auraValue() {
            return (this.hasDragonsCurve ? 1 : 0) + (this.hasRealityBending ? 0.1 : 0);
        }
        equal(dragon) {
            return dragon instanceof DragonAuras
                && this.hasDragonsCurve === dragon.hasDragonsCurve
                && this.hasRealityBending === dragon.hasRealityBending;
        }
        static fromGame() {
            // Return the DragonAuras corresponding to the current in-game state.
            return new DragonAuras(Game.hasAura("Dragon's Curve"), Game.hasAura("Reality Bending"));
        }
    }
    /* Makeshift enum!
     * All kinds of auras will be iterable via
     *  for(dragon of DragonAuras.all) {...}
     */
    DragonAuras.bothAuras = new DragonAuras(true, true);
    DragonAuras.onlyDragonsCurve = new DragonAuras(true, false);
    DragonAuras.onlyRealityBending = new DragonAuras(false, true);
    DragonAuras.neitherAuras = new DragonAuras(false, false);
    DragonAuras.all = [
        DragonAuras.neitherAuras,
        DragonAuras.onlyRealityBending,
        DragonAuras.onlyDragonsCurve,
        DragonAuras.bothAuras,
    ];

    function currentLumpType() {
        switch (Game.lumpCurrentType) {
            case 0: return 'normal';
            case 1: return 'bifurcated';
            case 2: return 'golden';
            case 3: return 'meaty';
            case 4: return 'caramelized';
            default: return 'unknown';
        }
    }
    /* Returns a number representing the Pantheon slot that is current occupied by Rigidel.
     * The number is 3 if Diamond, 2 if Ruby, 1 if Jade, and 0 if unslotted
     * (or if the Pantheon is not loaded).
     *
     * Note that the slot order is different from the order in the game;
     * this simplifies calculations.
     *
     * Note also that if the number of buildings is not a multiple of ten,
     * Rigidel will be inactive regardless of the value of currentRigidelSlot.
     */
    function currentRigidelSlot() {
        if (Game.hasGod && Game.hasGod('order')) {
            return 4 - Number(Game.hasGod('order'));
        }
        else {
            return 0;
        }
    }

    /* Atttributes from the game that affect lump maturation time
     * which can be easily modified by the player.
     */
    class TransientState {
        /* grandmapocalypseStage is a number between 0 and 3,
         * dragon is an object of DragonAuras,
         * rigidelSlot===0 means unslotted, 1 means Jade, 2 means Ruby, 3 means Diamond
         * (note that this is a different convention than the one used in minigamePantheon.js);
         * grandmaCount is the number of grandmas.
         *
         * For ease of use,
         * PersistentState.prototype.predictLumpType (and related method)
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
            return state instanceof TransientState
                && this.dragon.equal(state.dragon)
                && this.rigidelSlot === state.rigidelSlot
                && this.grandmaCount === state.grandmaCount
                && this.lumpType === state.lumpType;
        }
        // Returns the current state of the game.
        static current() {
            let dragon = DragonAuras.fromGame();
            let grandmapocalypseStage = Game.elderWrath;
            let rigidelSlot = currentRigidelSlot();
            if (Game.BuildingsOwned % 10 != 0)
                rigidelSlot = 0;
            let grandmaCount = Game.Objects['Grandma'].amount;
            return new this(grandmapocalypseStage, dragon, rigidelSlot, grandmaCount);
        }
        /* States which differ only in their grandmapocalypseStage are generated together.
         * This guarantees that they are grouped when sorting by autoharvestTime,
         * as Array.prototype.sort is stable. */
        static initGrandmalessStates() {
            let states = [];
            for (let dragon of DragonAuras.all) {
                for (let rigidelSlot = 0; rigidelSlot <= 3; rigidelSlot++) {
                    for (let gStage = 0; gStage <= 3; gStage++) {
                        states.push(new this(gStage, dragon, rigidelSlot, 0));
                    }
                }
            }
            return states;
        }
        static initGrandmafulStates() {
            let states = [];
            for (let dragon of DragonAuras.all) {
                for (let rigidelSlot = 0; rigidelSlot <= 3; rigidelSlot++) {
                    let grandmaCount = (rigidelSlot === 0 ? 0 : 401);
                    /* Having n grandmas with Rigidel in slot k
                     * is the same thing as having n+200 grandmas with Rigidel in slot k-1.
                     * The condition above prevents equivalent configurations from being generated.
                     * It favors using grandmas instead of Rigidel;
                     * the idea is to maximize the usefulness of the pantheon
                     * for uses beyond this trick. */
                    for (; grandmaCount <= 600; grandmaCount++) {
                        for (let gStage = 0; gStage <= 3; gStage++) {
                            states.push(new this(gStage, dragon, rigidelSlot, grandmaCount));
                        }
                    }
                }
            }
            return states;
        }
    }
    TransientState.grandmalessStates = TransientState.initGrandmalessStates(); // All possible states without grandmas
    TransientState.grandmafulStates = TransientState.initGrandmafulStates(); // All possible (inequivalent) states with grandmas

    /* Returns a string for a <div> tag that displays the given icon. */
    function makeIcon(icon, transparent = false) {
        let transparency = '';
        let background = '';
        if (icon === 'lump_normal')
            background += 'background-position: -1392px -672px;';
        if (icon === 'lump_bifurcated')
            background += 'background-position: -1392px -720px;';
        if (icon === 'lump_golden')
            background += 'background-position: -1344px -768px;';
        if (icon === 'lump_meaty')
            background += 'background-position: -1392px -816px;';
        if (icon === 'lump_caramelized')
            background += 'background-position: -1392px -1296px;';
        if (icon === 'aura_dragons_curve')
            background += 'background-position: -960px -1200px;';
        if (icon === 'aura_reality_bending')
            background += 'background-position: -1536px -1200px;';
        if (icon === 'none')
            background += 'background-position:48px 48px;';
        if (transparent)
            transparency += 'opacity: 0.2;';
        return '<div class="icon" style="vertical-align: middle; margin: 0 -4px;' + background + transparency + '"></div>';
    }
    /* Same as above but for buildings instead. */
    function makeGrandmaIcon(type, transparent) {
        let background = "background-image: url('img/buildings.png?v=5');";
        let transparency = '';
        if (type === 'appeased')
            background += 'background-position: 0px -64px;';
        if (type === 'awoken')
            background += 'background-position: 0px -128px;';
        if (type === 'displeased')
            background += 'background-position: -64px -128px;';
        if (type === 'angered')
            background += 'background-position: -128px -128px;';
        if (transparent)
            transparency += 'opacity: 0.2;';
        return '<div style="display: inline-block; width:64px; height:64px; vertical-align: middle;' + background + transparency + '"></div>';
    }
    /* Similar as above, but builds a Rigidel with a pantheon icon instead.
     * slot === 0 means unslotted, slot === 1 means jade slot, 2 is ruby and 3 is diamond. */
    function makeRigidelIcon(slot) {
        let rigidel = '<div class="icon" style="background-position:-1056px -912px"></div>';
        let gem_background = '';
        if (slot === 3)
            gem_background += 'background-position: -1104px -720px;';
        if (slot === 2)
            gem_background += 'background-position: -1128px -720px;';
        if (slot === 1)
            gem_background += 'background-position: -1104px -744px;';
        if (slot === 0)
            gem_background += 'background-position: -1128px -744px;'; // No background
        let gem = '<div class="icon" style="width:24px;height:24px; position:absolute; top: 36px; left: 12px;' + gem_background + '"></div>';
        return '<div style="height: 60px; position:relative; display:inline-block; vertical-align:middle;' + (slot === 0 ? 'opacity:0.2' : '') + '">' + rigidel + gem + '</div>';
    }

    /* In CYOL.init(),
     * a call to sneakySaveDataRetrieval is injected right before the new lump type is calculated.
     * This allows us to display the actual value of discrepancy to the user.
     */
    let previousAutoharvestTime = null;
    let previousLumpT = null;
    /* It seems that, in rare cases,
     * the game might try to loadLumps before all minigames have finished loading.
     * This means that the bonus from Rigidel cannot be computed
     * and is simply skipped.
     * So we warn the player about this issue in the lump tooltip.
     */
    let warnPantheonNotLoaded = false;
    function sneakySaveDataRetrieval() {
        previousLumpT = Game.lumpT;
        previousAutoharvestTime = Game.lumpT + Game.lumpOverripeAge;
        warnPantheonNotLoaded = !Game.hasGod;
    }

    /* Attributes from the game that are not easily modifiable by the player,
     * like having certain upgrades.
     */
    class PersistentState {
        constructor(seed, // Corresponds to Game.seed
        lumpT, // Time that the current lump type started coalescing
        hasSteviaCaelestis, hasSucralosiaInutilis, hasSugarAgingProcess) {
            this.seed = seed;
            this.lumpT = lumpT;
            this.hasSteviaCaelestis = hasSteviaCaelestis;
            this.hasSucralosiaInutilis = hasSucralosiaInutilis;
            this.hasSugarAgingProcess = hasSugarAgingProcess;
        }
        /* Computes the predictions for all compatible transient states. */
        allPredictions(discrepancy) {
            let states = this.hasSugarAgingProcess ? TransientState.grandmafulStates : TransientState.grandmalessStates;
            for (let state of states) {
                this.predictLumpType(state, discrepancy);
            }
            states.sort((state1, state2) => state1.autoharvestTime - state2.autoharvestTime);
            return states;
        }
        /* Computes the lump type for the given transient state.
         * The lump type and autoharvest times are stored in the transient state
         * as the attributes lumpType and autoharvestTime, respectively.
         */
        predictLumpType(transientState, discrepancy, verbose = false) {
            discrepancy = Number(discrepancy); // Just to be sure
            let ripeAge = 23 * 60 * 60 * 1000; // 23 hours
            if (this.hasSteviaCaelestis)
                ripeAge -= 60 * 60 * 1000;
            if (this.hasSugarAgingProcess)
                ripeAge -= 6 * 1000 * Math.min(transientState.grandmaCount, 600);
            ripeAge -= 20 * 60 * 1000 * transientState.rigidelSlot;
            ripeAge /= 1 + 0.05 * transientState.dragon.auraValue();
            let autoharvestTime = Math.floor(this.lumpT) + ripeAge + 60 * 60 * 1000 + discrepancy;
            /* This technique for choosing the lump type
             * only really works if we save the game and load it _after_ the autoharvest time.
             * However, although the game works just fine using fractional Game.lumpT values,
             * the game truncates the number when saving.
             * Thus we must assume that we have the truncated number here.
             */
            Math.seedrandom(this.seed + '/' + autoharvestTime);
            let types = ['normal'];
            let loop = 1 + randomFloor(transientState.dragon.auraValue());
            for (let i = 0; i < loop; i++) {
                if (Math.random() < (this.hasSucralosiaInutilis ? 0.15 : 0.1))
                    types.push('bifurcated');
                if (Math.random() < 3 / 1000)
                    types.push('golden');
                if (Math.random() < 0.1 * transientState.grandmapocalypseStage)
                    types.push('meaty');
                if (Math.random() < 1 / 50)
                    types.push('caramelized');
            }
            let lumpType = choose(types);
            Math.seedrandom();
            if (verbose)
                console.log("Predicted type: " + lumpType + ", ripe age: " + ripeAge + ", autoharvest time: " + autoharvestTime);
            transientState.lumpType = lumpType;
            transientState.autoharvestTime = autoharvestTime;
            return lumpType;
        }
        /* Determine whether the two states are equal. */
        equal(state) {
            return state instanceof PersistentState
                && state.seed === this.seed
                && state.lumpT === this.lumpT
                && state.hasSteviaCaelestis === this.hasSteviaCaelestis
                && state.hasSucralosiaInutilis === this.hasSucralosiaInutilis
                && state.hasSugarAgingProcess === this.hasSugarAgingProcess;
        }
        // The current state of the game
        static current() {
            let seed = Game.seed;
            let lumpT = Game.lumpT;
            let hasSteviaCaelestis = Boolean(Game.Has('Stevia Caelestis'));
            let hasSucralosiaInutilis = Boolean(Game.Has('Sucralosia Inutilis'));
            let hasSugarAgingProcess = Boolean(Game.Has('Sugar aging process'));
            return new this(seed, lumpT, hasSteviaCaelestis, hasSucralosiaInutilis, hasSugarAgingProcess);
        }
    }

    let cachedPredictions = null;
    let cachedState = null; // the PersistentState that was used to compute cachedPredictions
    let cachedDiscrepancy = -1;
    /* Recomputes cachedPredictions if cachedState differs from the current state,
     * or if cachedPredictions === null. */
    function computePredictions() {
        let currentState = PersistentState.current();
        if (currentState.equal(cachedState)
            && cachedPredictions !== null
            && cachedDiscrepancy === effectiveDiscrepancy()) {
            return;
        }
        cachedState = currentState;
        cachedDiscrepancy = effectiveDiscrepancy();
        cachedPredictions = currentState.allPredictions(effectiveDiscrepancy());
    }

    /* Injects or modifies the function with the given name.
     * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
     */
    function rewriteCode(functionName, pattern, replacement) {
        let code = eval(functionName + ".toString()");
        let newCode = code.replace(pattern, replacement);
        eval(functionName + " = " + newCode);
    }
    /* Stringify the prediction state in a readable way. */
    function formatPredictionState(transientState, discrepancy) {
        let str = "Lump type: " + transientState.lumpType + ", with ";
        if (transientState.grandmaCount !== undefined)
            str += transientState.grandmaCount + " ";
        if (transientState.grandmapocalypseStage == 0)
            str += "appeased grandmas, ";
        if (transientState.grandmapocalypseStage == 1)
            str += "awoken grandmas, ";
        if (transientState.grandmapocalypseStage == 2)
            str += "displeased grandmas, ";
        if (transientState.grandmapocalypseStage == 3)
            str += "angered grandmas, ";
        str += transientState.dragon + ", ";
        if (transientState.rigidelSlot == 0)
            str += "Rigidel unslotted,";
        if (transientState.rigidelSlot == 1)
            str += "Rigidel on Jade slot,";
        if (transientState.rigidelSlot == 2)
            str += "Rigidel on Ruby slot,";
        if (transientState.rigidelSlot == 3)
            str += "Rigidel on Diamond slot,";
        str += " and " + discrepancy + " of discrepancy.";
        return str;
    }
    function predictNextLumpType(discrepancy, verbose = false) {
        let transientState = TransientState.current();
        let persistentState = PersistentState.current();
        return persistentState.predictLumpType(transientState, discrepancy, verbose);
    }

    // Builds a string that displays the discrepancy and the current lump type.
    function discrepancyTooltip() {
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
        if (Game.hasGod && warnPantheonNotLoaded) {
            str += '<div style="color:red">' +
                'The Pantheon was still loading when the current lump type was computed,' +
                ' so Rigidel may have had no effect.' +
                ' Try reloading your save game again if the lump type is not the expected type.' +
                '</div>';
        }
        if (previousAutoharvestTime != null) {
            let discrepancy = Game.lumpT - previousAutoharvestTime;
            if (Game.lumpT === previousLumpT) {
                str += '<div style="color:gray">' +
                    'No discrepancy information to show.' +
                    ' This is likely because no sugar lumps were harvested while the game was closed.' +
                    ' Try exporting your save game and reloading after a lump is auto-harvested!' +
                    '</div>';
            }
            else if (discrepancy < 0 || discrepancy > 100) {
                str += '<div>' +
                    'The actual discrepancy is ' + discrepancy + ', which seems wrong...';
                if (discrepancy < 0) {
                    str += ' Maybe no lump was harvested when the save game was loaded?';
                }
                else {
                    str += ' Maybe more than one lump was harvested when the save game was loaded?';
                }
                str += '</div>';
                // The threshold is 100 because it is the highest the slider can go in the options menu
            }
            else {
                str += "<div>The actual discrepancy was ";
                if (discrepancy === effectiveDiscrepancy()) {
                    str += '<div style="display:inline; color:green">' + discrepancy + ' milliseconds</div>,';
                    str += ' precisely what we expected!<br />';
                }
                else {
                    str += '<div style="display:inline; color:red">' + discrepancy + ' milliseconds</div>,';
                    if (discrepancy < effectiveDiscrepancy())
                        str += ' less than what we expected.';
                    else
                        str += ' more than what we expected.';
                }
                if (discrepancy !== effectiveDiscrepancy())
                    str += ' Try reloading the save if the lump has the wrong type.';
                str += '</div>';
            }
        }
        else {
            str += '<div style="color:gray">No discrepancy information to show.' +
                ' Try loading your game after CYOL finishes launching!' +
                '</div>';
        }
        return str;
    }
    /* Decides whether the given prediction is desirable
     * based on current user preferences.
     */
    function isDesirablePrediction(prediction, additionalGrandmapocalypseStages) {
        if (targetTypes().indexOf(prediction.lumpType) === -1)
            return false;
        let current = TransientState.current();
        if (settings.preserveGrandmapocalypseStage) {
            if (!additionalGrandmapocalypseStages[current.grandmapocalypseStage])
                return false;
        }
        if (settings.preserveDragon) {
            if (!current.dragon.equal(prediction.dragon))
                return false;
        }
        // Last thing: the pantheon
        if (settings.preservePantheon) {
            if (prediction.rigidelSlot === 0)
                return true;
            // If CYOL.TransientState.init generated 'prediction' with a slotted Rigidel,
            // then we absolutely need it.
            let currentSlot = currentRigidelSlot();
            // We cannot use current.rigidelSlot because it considers inactive Rigidel as slot 0
            if (!prediction.grandmaCount)
                return currentSlot === prediction.rigidelSlot;
            let extraGrandmas = 200 * (prediction.rigidelSlot - currentSlot); // make up the difference
            return prediction.grandmaCount + extraGrandmas <= 600
                && prediction.grandmaCount + extraGrandmas >= 0;
        }
        // Passed all tests!
        return true;
    }
    // Constructs a fancy table of predictions
    function predictionTable() {
        computePredictions();
        let str = '';
        let rows = 0, i = 0;
        while (rows < settings.rowsToDisplay && i < cachedPredictions.length) {
            let grandmapocalypseStages = [false, false, false, false];
            let prediction = cachedPredictions[i];
            while (prediction.almostEqual(cachedPredictions[i])) {
                grandmapocalypseStages[cachedPredictions[i].grandmapocalypseStage] = true;
                i++;
            }
            if (!isDesirablePrediction(prediction, grandmapocalypseStages)) {
                continue;
            }
            else {
                rows++; // This is a valid row
            }
            str += makeIcon('lump_' + prediction.lumpType) + ':';
            if (prediction.grandmaCount) {
                str += '<div style="width: 5ex; display: inline-block; vertical-align:middle; text-align:right; margin-right:5px;">' + prediction.grandmaCount + 'x</div>';
            }
            else {
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
        if (rows < settings.rowsToDisplay) {
            str += 'No other matching predictions found.';
            if (rows === 0) {
                str += '<br />Try displaying more lump types in the settings!';
            }
        }
        return str;
    }
    function customLumpTooltip(str, _phase) {
        computePredictions();
        str = str.replace('width:400px', 'width:475px'); // FIXME kludge; widens the tooltip box
        str += '<div class="line"></div>';
        str += discrepancyTooltip();
        str += '<div class="line"></div>';
        // Next lump type
        let type = predictNextLumpType(effectiveDiscrepancy());
        str += 'Predicted next lump type: ' + makeIcon('lump_' + type) + ' ' + type + '.';
        if (Game.hasGod && Game.BuildingsOwned % 10 !== 0 && Game.hasGod('order')) {
            str += ' Rigidel not active!';
        }
        str += '<br />';
        str += 'Predictions: <br />';
        str += predictionTable();
        return str;
    }

    /* The next three functions must be available in the global namespace
     * under the CYOL.UI object.
     */
    function discrepancyCallback() {
        let value = document.getElementById('CYOLdiscrepancySlider').value ?? 1;
        settings.discrepancy = Number(value);
        document.getElementById('CYOLdiscrepancySliderRightText').innerHTML = value;
    }
    function rowsToDisplayCallback() {
        let value = document.getElementById('CYOLrowsToDisplaySlider').value ?? 10;
        settings.rowsToDisplay = Number(value);
        document.getElementById('CYOLrowsToDisplaySliderRightText').innerHTML = value;
    }
    function toggleSettings(buttonId, settingsName, onText, offText) {
        settings[settingsName] = !settings[settingsName];
        let element = document.getElementById(buttonId);
        if (settings[settingsName]) {
            element.classList.remove("off");
            element.innerHTML = onText;
        }
        else {
            element.classList.add("off");
            element.innerHTML = offText;
        }
    }
    // Constructs a button for toggling settings[settingsName].
    function makeButton(settingsName, onText, offText) {
        let buttonClass = "option" + (settings[settingsName] ? "" : " off");
        let buttonId = 'CYOLbutton' + settingsName;
        let onclick = "CYOL.UI.toggleSettings('" + buttonId + "', '" +
            settingsName + "', '" + onText + "', '" + offText + "');" +
            'PlaySound(\'snd/tick.mp3\');';
        return '<a class="' + buttonClass + '"' +
            ' id="' + buttonId + '"' +
            ' onclick="' + onclick + '">' +
            (settings[settingsName] ? onText : offText) +
            '</a>';
    }
    function customOptionsMenu() {
        let menuStr = "";
        menuStr += '<div class="listing">'
            + Game.WriteSlider('CYOLdiscrepancySlider', 'Discrepancy', '[$]', () => settings.discrepancy, 'CYOL.UI.discrepancyCallback()')
            + '</div>';
        menuStr += '<div class="listing">'
            + Game.WriteSlider('CYOLrowsToDisplaySlider', 'Rows of predictions to display', '[$]', () => settings.rowsToDisplay, 'CYOL.UI.rowsToDisplayCallback()')
            + '</div>';
        menuStr += '<div class="listing">';
        menuStr += makeButton('includeNormal', 'Showing normal lumps', 'Hiding normal lumps');
        menuStr += makeButton('includeBifurcated', 'Showing bifurcated lumps', 'Hiding bifurcated lumps');
        menuStr += makeButton('includeGolden', 'Showing golden lumps', 'hiding golden lumps');
        menuStr += makeButton('includeMeaty', 'Showing meaty lumps', 'hiding meaty lumps');
        menuStr += makeButton('includeCaramelized', 'Showing caramelized lumps', 'Hiding caramelized lumps');
        menuStr += '<label>Whether to display or hide predictions resulting in the corresponding lump type</label></div>';
        menuStr += '<div class="listing">';
        menuStr += makeButton('preserveGrandmapocalypseStage', 'Only current grandmapocalypse stage', 'Any grandmapocalypse stage');
        menuStr += '<label>Whether to display only predictions which match the current grandmapocalypse stage or not</label></div>';
        menuStr += '<div class="listing">';
        menuStr += makeButton('preserveDragon', 'Only current dragon auras', 'Any dragon auras');
        menuStr += '<label>Whether to display only predictions which match the current dragon auras or not</label></div>';
        menuStr += '<div class="listing">';
        menuStr += makeButton('preservePantheon', 'Only current pantheon configuration', 'Any pantheon configuration');
        menuStr += '<label>Whether to display only predictions which match the current pantheon or not (note Rigidel can be disabled by manipulating the number of buildings)</label></div>';
        CCSE.AppendCollapsibleOptionsMenu("Choose Your Own Lump", menuStr);
    }

    var version$1 = "1.3.1";

    /* These functions turn the CYOL object compatible with the Mod interface,
     * used by Game.registerMod.
     */
    let name = "Choose Your Own Lump";
    let version = version$1;
    let GameVersion = "2.031";
    let CCSEVersion = "2.025";
    let isLoaded = false;
    function save() {
        return exportSettings();
    }
    function load(str) {
        loadSettingsFrom(str);
    }
    function init() {
        // Legacy data, was previously stored in CCSE.config.OtherMods
        if (CCSE.config.OtherMods.CYOL) {
            loadSettingsFrom(JSON.stringify(CCSE.config.OtherMods.CYOL));
            // Using JSON.stringify is easier than writing a separate function just for legacy support
            delete CCSE.config.OtherMods.CYOL; // be a good citizen and not bloat CCSE's save object
        }
        Game.customLumpTooltip.push(customLumpTooltip);
        Game.customOptionsMenu.push(customOptionsMenu);
        Game.customStatsMenu.push(function () {
            CCSE.AppendStatsVersionNumber(name, version);
        });
        rewriteCode('Game.loadLumps', "Game.computeLumpTimes();", "$& CYOL.UI.sneakySaveDataRetrieval();");
        isLoaded = true;
        Game.Notify('Choose Your Own Lump loaded!', '', undefined, 1, true);
    }

    var index = {
        __proto__: null,
        settings: settings,
        loadSettingsFrom: loadSettingsFrom,
        exportSettings: exportSettings,
        effectiveDiscrepancy: effectiveDiscrepancy,
        targetTypes: targetTypes,
        get cachedDiscrepancy () { return cachedDiscrepancy; },
        get cachedPredictions () { return cachedPredictions; },
        get cachedState () { return cachedState; },
        computePredictions: computePredictions,
        makeIcon: makeIcon,
        makeGrandmaIcon: makeGrandmaIcon,
        makeRigidelIcon: makeRigidelIcon,
        currentLumpType: currentLumpType,
        get previousAutoharvestTime () { return previousAutoharvestTime; },
        get previousLumpT () { return previousLumpT; },
        get warnPantheonNotLoaded () { return warnPantheonNotLoaded; },
        sneakySaveDataRetrieval: sneakySaveDataRetrieval,
        discrepancyTooltip: discrepancyTooltip,
        isDesirablePrediction: isDesirablePrediction,
        predictionTable: predictionTable,
        customLumpTooltip: customLumpTooltip,
        discrepancyCallback: discrepancyCallback,
        rowsToDisplayCallback: rowsToDisplayCallback,
        toggleSettings: toggleSettings,
        makeButton: makeButton,
        customOptionsMenu: customOptionsMenu
    };

    var CYOL = {
        __proto__: null,
        name: name,
        version: version,
        GameVersion: GameVersion,
        CCSEVersion: CCSEVersion,
        get isLoaded () { return isLoaded; },
        save: save,
        load: load,
        init: init,
        DragonAuras: DragonAuras,
        TransientState: TransientState,
        PersistentState: PersistentState,
        formatPredictionState: formatPredictionState,
        predictNextLumpType: predictNextLumpType,
        rewriteCode: rewriteCode,
        UI: index
    };

    window.CYOL = CYOL;
    if (typeof CCSE == 'undefined')
        Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
    if (!isLoaded) {
        let id = 'Choose your own lump';
        if (window.CCSE && window.CCSE.isLoaded) {
            Game.registerMod(id, CYOL);
        }
        else {
            if (!window.CCSE)
                window.CCSE = {};
            if (!window.CCSE.postLoadHooks)
                window.CCSE.postLoadHooks = [];
            window.CCSE.postLoadHooks.push(function () {
                if (window.CCSE.ConfirmGameCCSEVersion(name, version, GameVersion, CCSEVersion)) {
                    Game.registerMod(id, CYOL);
                }
            });
        }
    }

})));
