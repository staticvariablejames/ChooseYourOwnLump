/* Tools for iterating through all configurations defined in 'core.ts'
 * and filtering the "good" configurations.
 */

import { LumpType, PantheonSlot, BudgetInfo, PlannerRelevantState } from './types';
import { DistilledPlannerConfiguration, rigidelPower, PlannerCore } from './core';

export const distilledConfigurationsCount = 2*2*1201;
export function* makeConfigurationsIterator(core: PlannerCore) {
    let startGrandmaCount = core.hasSugarAgingProcess ? 1200 : 600;
    let configurations: DistilledPlannerConfiguration[] = [
        {effectiveGrandmaCount: startGrandmaCount, hasDragonsCurve: false, hasRealityBending: false},
        {effectiveGrandmaCount: startGrandmaCount, hasDragonsCurve: false, hasRealityBending: true},
        {effectiveGrandmaCount: startGrandmaCount, hasDragonsCurve: true,  hasRealityBending: false},
        {effectiveGrandmaCount: startGrandmaCount, hasDragonsCurve: true,  hasRealityBending: true},
    ];
    while(configurations.length != 0) {
        let earliest = 0;
        for(let i = 1; i < configurations.length; i++) {
            if(core.overripeAge(configurations[i]) < core.overripeAge(configurations[earliest]))
                earliest = i;
        }
        yield {...configurations[earliest]};

        if(core.hasSugarAgingProcess) {
            configurations[earliest].effectiveGrandmaCount--;
        } else {
            configurations[earliest].effectiveGrandmaCount -= 200;
        }
        if(configurations[earliest].effectiveGrandmaCount < 0)
            configurations.splice(earliest, 1);
    }
}

export const canonicalIndicesCount = 2*2*1201;
export function canonicalIndex(configuration: DistilledPlannerConfiguration) {
    return 1201*((configuration.hasDragonsCurve ? 2 : 0) + (configuration.hasRealityBending ? 1 : 0))
        + configuration.effectiveGrandmaCount;
}

export type PartialConfiguration = {
    grandmaCount: number;
    hasDragonsCurve: boolean;
    hasRealityBending: boolean;
    hasSupremeIntellect: boolean;
    rigidelSlot: PantheonSlot;
}
export type PlannerConfiguration = PartialConfiguration & {
    grandmapocalypseStages: [boolean, boolean, boolean, boolean],
    lumpType: LumpType,
};

/* Maps the canonicalIndex of a distilled configuration
 * to a list PartialConfiguration[] of all compatible configurations.
 */
export const precomputedPartialConfigurations: PartialConfiguration[][] =
(() => {
    function distill(configuration: PartialConfiguration): DistilledPlannerConfiguration {
        let myRigidelPower = rigidelPower(configuration.rigidelSlot, configuration.hasSupremeIntellect);
        return {
            effectiveGrandmaCount: myRigidelPower + Math.min(600, configuration.grandmaCount),
            hasDragonsCurve: configuration.hasDragonsCurve,
            hasRealityBending: configuration.hasRealityBending,
        };
    }

    let partialConfigurations: PartialConfiguration[][]
        // Why don't Array.map works with undefined values? :(
        = Array(canonicalIndicesCount).fill([]).map(() => []);
    for(let grandmaCount = 0; grandmaCount <= 600; grandmaCount++) {
        for(let rigidelSlot of ['diamond', 'ruby', 'jade', 'none'] as PantheonSlot[]) {
            for(let hasDragonsCurve of [false, true]) {
                for(let hasRealityBending of [false, true]) {
                    for(let hasSupremeIntellect of [false, true]) {
                        if(hasDragonsCurve && hasRealityBending && hasSupremeIntellect)
                            continue;

                        let configuration = {
                            grandmaCount,
                            rigidelSlot,
                            hasDragonsCurve,
                            hasRealityBending,
                            hasSupremeIntellect
                        };
                        partialConfigurations[canonicalIndex(distill(configuration))].push(configuration);
                    }
                }
            }
        }
    }

    return partialConfigurations;
})();

/* The brute-forcing part of finding appropriate configurations
 * will produce, for each sought-after lump type,
 * a sequence of PlannerConfiguration in ascending order of autoharvest time.
 *
 * A ConfigurationFilter is a function which takes a PlannerConfiguration as input,
 * and returns whether it considers that configuration to be "good" or not.
 *
 * Because this brute-force generation will happen for each lump type,
 * ConfigurationFilter functions should generally not inspect the lump type
 * when deciding whether to filter or not the configuration,
 * and in fact none of the four default-defined filters below do.
 */
export type ConfigurationFilter = (configuration: PlannerConfiguration) => boolean;

export function makeTrivialConfigurationFilter(): ConfigurationFilter {
    return (_) => true;
}

export function makeDragonPreservingConfigurationFilter(gameState: PlannerRelevantState): ConfigurationFilter {
    return (configuration: PlannerConfiguration) => {
        return configuration.hasDragonsCurve == gameState.currentHasDragonsCurve &&
            configuration.hasRealityBending == gameState.currentHasRealityBending &&
            configuration.hasSupremeIntellect == gameState.currentHasSupremeIntellect;
    }
}

export function makePantheonPreservingConfigurationFilter(gameState: PlannerRelevantState): ConfigurationFilter {
    return (configuration: PlannerConfiguration) => {
        if(configuration.rigidelSlot == gameState.currentRigidelSlot) {
            return true;
        }
        if(configuration.rigidelSlot == 'none') {
            // We can always disable Rigidel by making the number of buildings not a multiple of 10
            return true;
        }
        return false;
    }
}

export function makeGrandmapocalypseStagePreservingFilter(gameState: PlannerRelevantState): ConfigurationFilter {
    return (configuration: PlannerConfiguration) => {
        return configuration.grandmapocalypseStages[gameState.currentGrandmapocalypseStage];
    }
}

export function makeBudgetConsciousFilter(budget: BudgetInfo): ConfigurationFilter {
    return (configuration: PlannerConfiguration) => {
        if(configuration.grandmaCount > budget.maxGrandmas) return false;
        if(!budget.unlockedPantheon && configuration.rigidelSlot != 'none') return false;
        if(!budget.unlockedDragonsCurve && configuration.hasDragonsCurve) return false;
        if(!budget.unlockedRealityBending && configuration.hasRealityBending) return false;
        if(!budget.unlockedSupremeIntellect && configuration.hasSupremeIntellect) return false;
        let auraCount = Number(configuration.hasDragonsCurve) +
            Number(configuration.hasRealityBending) + Number(configuration.hasSupremeIntellect);
        if(!budget.unlockedSecondAura && auraCount > 1) return false;
        return true;
    }
}

export function makeIntersectionFilter(...filters: ConfigurationFilter[]): ConfigurationFilter {
    return (configuration: PlannerConfiguration) => {
        for(let filter of filters) {
            if(!filter(configuration)) return false;
        }
        return true;
    }
}

export class CachedConfigurationsProcessor {
    constructor(plannerCore: PlannerCore) {
        this.plannerCore = plannerCore;
        this.iterator = makeConfigurationsIterator(plannerCore);
    }

    /* Tells whether the given plannerCore is compatible with this object's PlannerCore,
     * for configuration processing purposes.
     */
    public isCacheCompatible(plannerCore: PlannerCore) {
        return plannerCore.discrepancy == this.plannerCore.discrepancy &&
               plannerCore.hasSteviaCaelestis == this.plannerCore.hasSteviaCaelestis &&
               plannerCore.hasSucralosiaInutilis == this.plannerCore.hasSucralosiaInutilis &&
               plannerCore.hasSugarAgingProcess == this.plannerCore.hasSugarAgingProcess &&
               plannerCore.currentLumpT == this.plannerCore.currentLumpT &&
               plannerCore.seed == this.plannerCore.seed;
    }

    // The attributes are public mainly for testing
    public plannerCore: PlannerCore;

    /* Suspended iterator.
     * It will navigate through all distilled configurations of plannerCore exactly once.
     * We will lazily call lumpTypePredictionSet for each of those configurations,
     * and store the results in `this.cache`.
     * Set to null when finished.
     */
    public iterator: ReturnType<typeof makeConfigurationsIterator> | null;

    /* this.cache[lumpType] is a list (in ascending order of overripeAge)
     * of all PlannerConfigurations yielding lumpType.
     */
    public cache: { [lumpType in LumpType]: PlannerConfiguration[][] } = {
        'normal': [], 'bifurcated': [], 'golden': [], 'meaty': [], 'caramelized': []
    };

    /* Steps the iterator and store the results on the cache.
     * Returns false if the iterator has finished, and true otherwise.
     */
    public cacheNextPredictionSet(): boolean {
        if(!this.iterator) return false;
        let next = this.iterator.next();
        if(next.done) {
            this.iterator = null;
            return false;
        }
        let predictionSet = this.plannerCore.lumpTypePredictionSet(next.value);
        for(let lumpType of new Set(predictionSet)) {
            let matchingGrandmapocalypseStages = predictionSet.map(type => type == lumpType);
            let configurations = precomputedPartialConfigurations[canonicalIndex(next.value)]
                .map((partialConfiguration:PartialConfiguration): PlannerConfiguration => ({
                        ...partialConfiguration,
                        lumpType,
                        grandmapocalypseStages: matchingGrandmapocalypseStages as [boolean, boolean, boolean, boolean],
                }));
            this.cache[lumpType].push(configurations);
        }
        return true;
    }

    /* Makes an iterator that iterates through all PlannerConfiguration sets
     * matching the given lump type.
     * It makes use and extends this object's cache.
     */
    public *makePlannerConfigurationIterator(lumpType: LumpType): Generator<PlannerConfiguration[]> {
        for(let configurationSet of this.cache[lumpType]) {
            yield configurationSet;
        }
        let nextIndex = this.cache[lumpType].length;
        while(this.cacheNextPredictionSet()) {
            // A "while" instead of an "if" allows this iterator to be suspended and continued later
            while(nextIndex < this.cache[lumpType].length) {
                yield this.cache[lumpType][nextIndex];
                nextIndex++;
            }
        }
    }

    /* This is the main public-facing function of this class.
     * It scans all the `PlannerConfiguration`s for the PlannerCore given in the constructor
     * and returns a list of successes, satisfying the following properties:
     *  - All filters in `options.requirements` accept all returned configurations.
     *  - Each filter in `options.goals` accepts at least one configuration.
     *  - Each configuration is accepted by at least one filter in `options.goals` (i.e. no redundancy).
     *  - The configurations' autoharvest time are the earliest possible satisfying these conditions.
     * The `failures` list contains all filters from `options.goals`
     * which did not accept any configuration
     * (besides configurations rejected by the filters in `options.requirements`).
     */
    public getConfigurations(options: {
        targetLump: LumpType,
        requirements: ConfigurationFilter[],
        goals: ConfigurationFilter[],
    }): {
        successes: PlannerConfiguration[],
        failures: ConfigurationFilter[],
    }
    {
        let acceptable = makeIntersectionFilter(...options.requirements);
        let successes: PlannerConfiguration[] = [];
        let goals = [...options.goals];
    loop:
        for(let configurationSet of this.makePlannerConfigurationIterator(options.targetLump)) {
            let acceptableConfigurations = configurationSet.filter(acceptable);
            if(acceptableConfigurations.length == 0) continue;
            let needsFurtherProcessing = true;
            while(needsFurtherProcessing) {
                let countOfGoalsAccepting = acceptableConfigurations.map(configuration => {
                    return goals.map(goal => Number(goal(configuration))).reduce((x,y) => x+y);
                });
                if(Math.max(...countOfGoalsAccepting) == 0) {
                    needsFurtherProcessing = false;
                } else {
                    let index = countOfGoalsAccepting.indexOf(Math.max(...countOfGoalsAccepting));
                    successes.push(acceptableConfigurations[index]);
                    goals = goals.filter(goal => !goal(acceptableConfigurations[index]));
                    /* We added to successes one of the configurations satisfying the most goals,
                     * and removed from goals the ones which are already satisfied.
                     * It is possible that some goal is satisfied by some acceptable configuration,
                     * but not by the one we just pushed to `successes`,
                     * so we still need another round of processing for this list of configurations.
                     */
                }
                if(goals.length == 0)
                    break loop;
            }
        }
        return {successes, failures: goals};
    }
};
