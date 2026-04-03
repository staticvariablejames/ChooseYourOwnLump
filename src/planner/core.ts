/* Core functionality of the planner.
 *
 * This file contains only the lump type algorithm
 * and tools for working with one game configuration at a time.
 * 'filtering.ts' contains tools for iterating through all configurations and filtering them.
 *
 * This file intentionally does not refer to `Game` anywhere,
 * allowing it to be tested outside of the game.
 * To get the current game state,
 * use the functions from the file `util.ts`.
 */

import seedrandom from 'seedrandom';
import { LumpType, PantheonSlot, PlannerRelevantState } from './types';
import { ConstructorData } from '../utilTypes';

/* This type distills the relevant parts of the game state
 * which affect lump autoharvest time and which the player can change easily,
 * with the exception of the grandmapocalypse stage (which is handled separately).
 *
 * Worshipping Rigidel on the diamond/ruby/jade slot makes lumps ripen 60/40/20 minutes sooner,
 * which is equivalent to having 600/400/200 extra grandmas.
 * The effectiveGrandmaCount is the sum of Rigidel's power with the current number of grandmas
 * (the latter capped at 600, which is the limit of Sugar Aging Process).
 *
 * The grandmapocalypse stage frequently does not affect the lump type,
 * so predictions that only differ in their grandmapocalypse stage are always presented together.
 * Hence the grandmapocalypse stage is not part of the DistilledPlannerConfiguration,
 * and is handled separately by the methods below.
 */
export type DistilledPlannerConfiguration = {
    effectiveGrandmaCount: number; // Always between 0 and 1200 (inclusive)
    hasDragonsCurve: boolean;
    hasRealityBending: boolean;
};

/* The power of Rigidel,
 * in terms of the number of grandmas it is equivalent to.
 */
export function rigidelPower(rigidelSlot: PantheonSlot, hasSupremeIntellect: boolean) {
    switch(rigidelSlot) {
        case 'diamond':
            return 600;
        case 'ruby':
            if(hasSupremeIntellect) return 600;
            else return 400;
        case 'jade':
            if(hasSupremeIntellect) return 400;
            else return 200;
        default:
            return 0;
    }
}

/* This class essentially just encapsulates the algorithm for choosing lump types.
 */
export class PlannerCore implements PlannerRelevantState {
    public discrepancy: number = 0;
    public hasSteviaCaelestis: boolean = false;
    public hasSucralosiaInutilis: boolean = false;
    public hasSugarAgingProcess: boolean = false;

    /* In natural gameplay, it is impossible to get "Sugar aging process" or "Sucralosia Inutilis"
     * without first getting "Stevia Caelestis",
     * but the planner works regardless.
     */
    public currentLumpT: number = 1.6e12;
    public currentSeed: string = 'aaaaa';

    public currentRigidelSlot: PantheonSlot = 'none';
    public currentGrandmaCount: number = 0;
    public currentGrandmapocalypseStage: number = 0;
    public currentHasDragonsCurve: boolean = false;
    public currentHasRealityBending: boolean = false;
    public currentHasSupremeIntellect: boolean = false;

    constructor(data: ConstructorData<PlannerCore>) {
        Object.assign(this, data);
    };

    /* How long (in milliseconds)
     * does it take for a lump in the given configuration to be autoharvested.
     * Note that this number may be fractional if Dragon's Curve or Reality Bending are used.
     */
    public overripeAge(configuration: DistilledPlannerConfiguration): number {
        let dragonBoost =
            (configuration.hasDragonsCurve ? 1.0 : 0.0) +
            (configuration.hasRealityBending ? 0.1 : 0.0);
        let ripeAge = 23 * 60*60*1000; // 23 hours
        if (this.hasSteviaCaelestis) ripeAge -= 60*60*1000;
        ripeAge -= 6*1000 * configuration.effectiveGrandmaCount;
        ripeAge /= 1 + 0.05*dragonBoost;
        return ripeAge + 60*60*1000;
    }

    /* The expected time at which the lump in the given configuration will autoharvest.
     * Includes the effect of the discrepancy.
     */
    public autoharvestTimestamp(configuration: DistilledPlannerConfiguration) {
        return this.currentLumpT + this.overripeAge(configuration) + this.discrepancy;
    }

    public lumpTypePredictionSet(configuration: DistilledPlannerConfiguration): LumpType[] {
        let autoharvestTime = this.autoharvestTimestamp(configuration);
        let prng = seedrandom(this.currentSeed + '/' + autoharvestTime);
        let lumpPools: LumpType[][] = [['normal'], ['normal'], ['normal'], ['normal']];

        let randomFloorPrngCall = prng();
        let loops = 1;
        if(configuration.hasDragonsCurve) loops += 1;
        // Manual implementation of randomFloor()
        if(configuration.hasRealityBending && randomFloorPrngCall < 0.1) loops += 1;

        for (let i = 0; i < loops; i++) {
            if(prng() < (this.hasSucralosiaInutilis?0.15:0.1)) {
                for(let pool of lumpPools) pool.push('bifurcated');
            }
            if(prng() < 3/1000) {
                for(let pool of lumpPools) pool.push('golden');
            }
            let grandmapocalypsePrngCall = prng();
            if(grandmapocalypsePrngCall < 0.1) lumpPools[1].push('meaty');
            if(grandmapocalypsePrngCall < 0.2) lumpPools[2].push('meaty');
            if(grandmapocalypsePrngCall < 0.3) lumpPools[3].push('meaty');
            if(prng() < 1/50) {
                for(let pool of lumpPools) pool.push('caramelized');
            }
        }
        let poolChoicePrngCall = prng();
        let predictionSet: LumpType[] = [];
        for(let i in lumpPools) {
            predictionSet[i] = lumpPools[i][Math.floor(poolChoicePrngCall * lumpPools[i].length)];
        }
        return predictionSet;
    }

    public currentPrediction(): LumpType {
        let myRigidelPower = rigidelPower(this.currentRigidelSlot, this.currentHasSupremeIntellect);
        let myGrandmaPower = this.hasSugarAgingProcess ? Math.min(600, this.currentGrandmaCount) : 0;
        let configuration: DistilledPlannerConfiguration = {
            effectiveGrandmaCount: myRigidelPower + myGrandmaPower,
            hasDragonsCurve: this.currentHasDragonsCurve,
            hasRealityBending: this.currentHasRealityBending,
        };
        let predictionSet = this.lumpTypePredictionSet(configuration);
        return predictionSet[this.currentGrandmapocalypseStage];
    }
}
