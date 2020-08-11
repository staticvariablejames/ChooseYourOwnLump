var CYOL = {};
// 'var' used here to avoid syntax errors if this script is loaded more than once
if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');
// CCSE calls Game.Win('Third-party') for us

// CYOL.launch is at the end of this file.

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
    constructor(grandmapocalypseStage, dragon, rigidelSlot, grandmaCount) {
        this.grandmapocalypseStage = grandmapocalypseStage;
        this.dragon = dragon;
        this.rigidelSlot = rigidelSlot;
        this.grandmaCount = grandmaCount;
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
    static grandmafulStates = undefined; // All possible states with grandmas
    static init() {
        // init() is called by CYOL.launch()
        this.grandmalessStates = [];
        this.grandmafulStates = [];

        for(let grandmapocalypseStage = 0; grandmapocalypseStage <= 3; grandmapocalypseStage++) {
            for(let dragon of CYOL.DragonAuras.all) {
                for(let rigidelSlot = 0; rigidelSlot <= 3; rigidelSlot++) {
                    this.grandmalessStates.push(new this(
                        grandmapocalypseStage, dragon, rigidelSlot
                    ));
                    for(let grandmaCount = 0; grandmaCount <= 600; grandmaCount++) {
                        this.grandmafulStates.push(new this(
                            grandmapocalypseStage, dragon, rigidelSlot, grandmaCount
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
        return states;
    }

    /* Returns only the states whose predicted value is contained in the list targetTypes,
     * sorted by autoharvestTime. */
    filteredPredictions(targetTypes, discrepancy) {
        let goodStates = [];
        for(let state of this.allPredictions(discrepancy)) {
            if(targetTypes.includes(state.lumpType))
                goodStates.push(state);
        }
        goodStates.sort((state1, state2) => state1.autoharvestTime - state2.autoharvestTime);
        return goodStates;
    }

    /* Computes the lump type for the given transient state.
     * The lump type and autoharvest times are stored in the transient state
     * as the attributes lumpType and autoharvestTime, respectively.
     */
    predictLumpType(transientState, discrepancy, verbose) {
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

CYOL.UI = {};
CYOL.UI.settings = {
    discrepancy: 1,
    includeNormal: false,
    includeBifurcated: false,
    includeGolden: true,
    includeCaramelized: false,
    targetTypes: function() {
        let types = [];
        if(this.includeNormal) types.push('normal');
        if(this.includeBifurcated) types.push('bifurcated');
        if(this.includeGolden) types.push('golden');
        if(this.includeMeaty) types.push('meaty');
        if(this.includeCaramelized) types.push('caramelized');
        return types;
    },
    predictionsToDisplay: 10, // Number of predictions to display in the lump tooltip
};

CYOL.UI.cachedPredictions = null;
CYOL.UI.cachedState = null; // the PersistentState that was used to compute cachedPredictions

/* Recomputes cachedPredictions if cachedState differs from the current state,
 * or if cachedPredictions === null. */
CYOL.UI.computePredictions = function() {
    let currentState = CYOL.PersistentState.current();
    if(currentState.equal(CYOL.UI.cachedState) && CYOL.UI.cachedPredictions !== null) return;
    CYOL.UI.cachedState = currentState;
    CYOL.UI.cachedPredictions = currentState.filteredPredictions(CYOL.UI.settings.targetTypes(), CYOL.UI.settings.discrepancy);
}

CYOL.UI.makeLumpIcon = function(type) {
    let background_position = '';
    if(type === 'normal') background_position += 'background-position: -1392px -672px;';
    if(type === 'bifurcated') background_position += 'background-position: -1392px -720px;';
    if(type === 'golden') background_position += 'background-position: -1344px -768px;';
    if(type === 'meaty') background_position += 'background-position: -1392px -816px;';
    if(type === 'caramelized') background_position += 'background-position: -1392px -1296px;';
    return '<div class="icon" style="vertical-align: middle; margin-right: -8px;' + background_position + '""></div>';
}

CYOL.UI.customLumpTooltip = function(str, phase) {
    str += '<div class="line"></div>';
    let type = CYOL.predictNextLumpType(CYOL.UI.settings.discrepancy);
    str += 'Predicted next lump type: ' + CYOL.UI.makeLumpIcon(type) + ' ' + type + '<br />';
    CYOL.UI.computePredictions();
    for(let i = 0; i < CYOL.UI.settings.predictionsToDisplay && i < CYOL.UI.cachedPredictions.length; i++)
        str += CYOL.formatPredictionState(CYOL.UI.cachedPredictions[i], CYOL.UI.settings.discrepancy) + '<br />';
    return str;
}

CYOL.UI.discrepancyCallback = function() {
    let value = document.getElementById('CYOLdiscrepancySlider').value ?? 1;
    CYOL.UI.settings.discrepancy = value;
    document.getElementById('CYOLdiscrepancySliderRightText').innerHTML = value;
    CYOL.UI.cachedPredictions = null;
}

CYOL.UI.predictionsToDisplayCallback = function() {
    let value = document.getElementById('CYOLpredictionsToDisplaySlider').value ?? 10;
    CYOL.UI.settings.predictionsToDisplay = value;
    document.getElementById('CYOLpredictionsToDisplaySliderRightText').innerHTML = value;
}

CYOL.UI.customOptionsMenu = function() {
    let menuStr = "";
    menuStr += '<div class="listing">'
        + Game.WriteSlider('CYOLdiscrepancySlider', 'Discrepancy', '[$]', () => CYOL.UI.settings.discrepancy, 'CYOL.UI.discrepancyCallback()')
        + '</div>';
    menuStr += '<div class="listing">'
        + Game.WriteSlider('CYOLpredictionsToDisplaySlider', 'Predictions to display', '[$]', () => CYOL.UI.settings.predictionsToDisplay, 'CYOL.UI.predictionsToDisplayCallback()')
        + '</div>';

    function makeButton(lumpType) {
        let settingsName = "include" + lumpType[0].toUpperCase() + lumpType.slice(1);
        let buttonClass = "option" + (CYOL.UI.settings[settingsName] ? "" : " off");
        let onclick = "CYOL.UI.settings." + settingsName + " = " +
            (CYOL.UI.settings[settingsName] ? "false;" : "true;") +
            "CYOL.UI.cachedPredictions = null;" +
            'PlaySound(\'snd/tick.mp3\');'
        return '<a class="' + buttonClass + '"' +
            'id="CYOL' + settingsName + '"' +
            'onclick="' + onclick + '">' +
            (CYOL.UI.settings[settingsName] ? "Showing " : "Hiding ") + lumpType + " lumps" +
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
    CYOL.DragonAuras.init();
    CYOL.TransientState.init();

    Game.customLumpTooltip.push(CYOL.UI.customLumpTooltip);
    Game.customOptionsMenu.push(CYOL.UI.customOptionsMenu);
    // Always display the lump type
    CCSE.ReplaceCodeIntoFunction('Game.lumpTooltip', '(phase>=3)', '(true) /* CYOL modification */', 0);

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
