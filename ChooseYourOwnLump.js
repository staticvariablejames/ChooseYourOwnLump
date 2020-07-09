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
 * which can be modified by the player.
 */
class ModifiableState {
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

        return new ModifiableState(
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
                    this.grandmalessStates.push(new ModifiableState(
                        grandmapocalypseStage, dragon, rigidelSlot
                    ));
                    for(let grandmaCount = 0; grandmaCount <= 600; grandmaCount++) {
                        this.grandmafulStates.push(new ModifiableState(
                            grandmapocalypseStage, dragon, rigidelSlot, grandmaCount
                        ));
                    }
                }
            }
        }
    }
}
ModifiableState.init();

function predictLumpType(state, discrepancy, verbose) {
    let ripeAge = 23 * 60*60*1000; // 23 hours
    if (Game.Has('Stevia Caelestis')) ripeAge -= 60*60*1000;
    if(state.grandmaCount) ripeAge -= 6*1000 * state.grandmaCount;
    ripeAge -= 20*60*1000 * state.rigidelSlot;
    ripeAge /= 1 + 0.05*state.dragon.auraValue();
    let autoharvestTime = Math.floor(Game.lumpT) + ripeAge + 60*60*1000 + discrepancy;
    /* This technique for choosing the lump type
     * only really works if we save the game and load it _after_ the autoharvest time.
     * However, although the game works just fine using fractional Game.lumpT values,
     * the game truncates the number when saving.
     * Thus we must assume that we have the truncated number here.
     */

    Math.seedrandom(Game.seed+'/'+autoharvestTime);

    let types=['normal'];
    let loop = 1 + randomFloor(state.dragon.auraValue());
    for (let i=0; i<loop; i++) {
        if (Math.random()<(Game.Has('Sucralosia Inutilis')?0.15:0.1)) types.push('bifurcated');
        if (Math.random()<3/1000) types.push('golden');
        if (Math.random()<0.1*state.grandmapocalypseStage) types.push('meaty');
        if (Math.random()<1/50) types.push('caramelized');
    }
    let lumpType = choose(types);
    Math.seedrandom();

    if(verbose) console.log("Predicted type: " + lumpType + ", ripe age: " + ripeAge + ", autoharvest time: " + autoharvestTime);
    return lumpType;
}

function allPredictions(targetTypes, hasSugarAgingProcess, discrepancy) {
    let stateList = hasSugarAgingProcess ? ModifiableState.grandmafulStates : ModifiableState.grandmalessStates;
    for(let state of stateList) {
        let lumpType = predictLumpType(state, discrepancy);
        if(targetTypes.includes(lumpType)) {
            prettyPrintPredictionState(lumpType, state, discrepancy);
        }
    }
}

function prettyPrintPredictionState(lumpType, state, discrepancy) {
    let str = "Lump type: " + lumpType + ", with ";
    if(state.grandmaCount !== -1) str += state.grandmaCount + " ";
    if(state.grandmapocalypseStage == 0) str += "appeased grandmas, ";
    if(state.grandmapocalypseStage == 1) str += "awoken grandmas, ";
    if(state.grandmapocalypseStage == 2) str += "displeased grandmas, ";
    if(state.grandmapocalypseStage == 3) str += "angered grandmas, ";

    str += state.dragon + ", ";

    if(state.rigidelSlot == 0) str += "Rigidel unslotted,";
    if(state.rigidelSlot == 1) str += "Rigidel on Jade slot,";
    if(state.rigidelSlot == 2) str += "Rigidel on Ruby slot,";
    if(state.rigidelSlot == 3) str += "Rigidel on Diamond slot,";

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

    let state = ModifiableState.current();
    return predictLumpType(state, discrepancy, verbose);
}
