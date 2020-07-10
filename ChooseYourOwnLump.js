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
        return new DragonAuras(Game.hasAura("Dragon's Curve"), Game.hasAura("Reality Bending"));
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
        this.bothAuras = new DragonAuras(true, true);
        this.onlyDragonsCurve = new DragonAuras(true, false);
        this.onlyRealityBending = new DragonAuras(false, true);
        this.neitherAuras = new DragonAuras(false, false);
        this.all = [this.neitherAuras, this.onlyRealityBending, this.onlyDragonsCurve, this.bothAuras];
    }
}
DragonAuras.init();

/* Atttributes from the game that affect lump maturation time
 * which can be easily modified by the player.
 */
class TransientState {
    constructor(grandmapocalypseStage, dragon, rigidelSlot, grandmaCount) {
        this.grandmapocalypseStage = grandmapocalypseStage;
        this.dragon = dragon;
        this.rigidelSlot = rigidelSlot;
        this.grandmaCount = grandmaCount;
    }

    // Returns the current state of the game.
    static current() {
        let dragon = DragonAuras.fromGame();
        let grandmapocalypseStage = Game.elderWrath;
        let rigidelSlot = 0;
        if (Game.hasGod && Game.BuildingsOwned%10==0 && Game.hasGod('order'))
            rigidelSlot = 4 - Game.hasGod('order');

        let effectiveGrandmas = Math.min(600,Game.Objects['Grandma'].amount);
        if (!Game.Has('Sugar aging process'))
            effectiveGrandmas = undefined;

        return new TransientState(
            grandmapocalypseStage, dragon, rigidelSlot, effectiveGrandmas
        );
    }

    static grandmalessStates = undefined; // All possible states without grandmas
    static grandmafulStates = undefined; // All possible states with grandmas
    static init() {
        this.grandmalessStates = [];
        this.grandmafulStates = [];

        for(let grandmapocalypseStage = 0; grandmapocalypseStage <= 3; grandmapocalypseStage++) {
            for(let dragon of DragonAuras.all) {
                for(let rigidelSlot = 0; rigidelSlot <= 3; rigidelSlot++) {
                    this.grandmalessStates.push(new TransientState(
                        grandmapocalypseStage, dragon, rigidelSlot
                    ));
                    for(let grandmaCount = 0; grandmaCount <= 600; grandmaCount++) {
                        this.grandmafulStates.push(new TransientState(
                            grandmapocalypseStage, dragon, rigidelSlot, grandmaCount
                        ));
                    }
                }
            }
        }
    }
}
TransientState.init();

/* Attributes from the game that are not easily modifiable by the player,
 * like having certain upgrades.
 */
class PersistentState {
    constructor(seed, lumpT, hasSteviaCaelestis, hasSucralosiaInutilis) {
        this.seed = seed; // Corresponds to Game.seed
        this.lumpT = lumpT; // Time that the current lump type started coalescing
        this.hasSteviaCaelestis = hasSteviaCaelestis;
        this.hasSucralosiaInutilis = hasSucralosiaInutilis;
    }

    /* Computes the lump type for the given transient state.
     * The lump type and autoharvest times are stored in the transient state
     * as the attributes lumpType and autoharvestTime, respectively.
     */
    predictLumpType(transientState, discrepancy, verbose) {
        let ripeAge = 23 * 60*60*1000; // 23 hours
        if (this.hasSteviaCaelestis) ripeAge -= 60*60*1000;
        if (transientState.grandmaCount) ripeAge -= 6*1000 * transientState.grandmaCount;
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

    // The current state of the game
    static current() {
        let seed = Game.seed;
        let lumpT = Game.lumpT;
        let hasSteviaCaelestis = Game.Has('Stevia Caelestis');
        let hasSucralosiaInutilis = Game.Has('Sucralosia Inutilis');
        return new PersistentState(
            seed, lumpT, hasSteviaCaelestis, hasSucralosiaInutilis
        );
    }
}

function allPredictions(targetTypes, hasSugarAgingProcess, discrepancy) {
    let transientStates = hasSugarAgingProcess ? TransientState.grandmafulStates : TransientState.grandmalessStates;
    let persistentState = PersistentState.current();
    let goodStates = [];
    for(let state of transientStates) {
        let lumpType = persistentState.predictLumpType(state, discrepancy);
        if(targetTypes.includes(lumpType)) {
            goodStates.push(state);
        }
    }
    goodStates.sort((state1, state2) => state1.autoharvestTime - state2.autoharvestTime);
    for(let state of goodStates) {
        prettyPrintPredictionState(state, discrepancy);
    }
}

function prettyPrintPredictionState(transientState, discrepancy) {
    let str = "Lump type: " + transientState.lumpType + ", with ";
    if(transientState.grandmaCount !== -1) str += transientState.grandmaCount + " ";
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

    console.log(str);
}

function earlyGamePredictions(discrepancy) {
    if(discrepancy === undefined) {
        throw new Error("Missing discrepancy parameter");
    }
    allPredictions(['bifurcated', 'golden', 'meaty', 'caramelized'], false, discrepancy);
}

function lateGamePredictions(discrepancy) {
    if(discrepancy === undefined) {
        throw new Error("Missing discrepancy parameter");
    }
    allPredictions(['golden'], true, discrepancy);
}

function predictNextLumpType(discrepancy, verbose) {
    if(discrepancy === undefined) {
        throw new Error("Missing discrepancy parameter");
    }

    let transientState = TransientState.current();
    let persistentState = PersistentState.current();
    return persistentState.predictLumpType(transientState, discrepancy, verbose);
}
