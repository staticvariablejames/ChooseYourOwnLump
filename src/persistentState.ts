import { TransientState } from './transientState';

/* Attributes from the game that are not easily modifiable by the player,
 * like having certain upgrades.
 */
export class PersistentState {
    constructor(
        public seed: string, // Corresponds to Game.seed
        public lumpT: number, // Time that the current lump type started coalescing
        public hasSteviaCaelestis: boolean,
        public hasSucralosiaInutilis: boolean,
        public hasSugarAgingProcess: boolean
    ) {}

    /* Computes the predictions for all compatible transient states. */
    allPredictions(discrepancy: number) {
        let states = this.hasSugarAgingProcess? TransientState.grandmafulStates : TransientState.grandmalessStates;
        for(let state of states) {
            this.predictLumpType(state, discrepancy);
        }
        states.sort((state1:any, state2:any) => state1.autoharvestTime - state2.autoharvestTime);
        return states;
    }

    /* Computes the lump type for the given transient state.
     * The lump type and autoharvest times are stored in the transient state
     * as the attributes lumpType and autoharvestTime, respectively.
     */
    predictLumpType(transientState: TransientState, discrepancy: number, verbose: boolean = false) {
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
        for (let i = 0; i < loop; i++) {
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
    equal(state: any) {
        return state instanceof PersistentState
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
        let hasSteviaCaelestis = Boolean(Game.Has('Stevia Caelestis'));
        let hasSucralosiaInutilis = Boolean(Game.Has('Sucralosia Inutilis'));
        let hasSugarAgingProcess = Boolean(Game.Has('Sugar aging process'));
        return new this(seed, lumpT, hasSteviaCaelestis, hasSucralosiaInutilis, hasSugarAgingProcess);
    }
}
