/* Tools for iterating through all configurations defined in 'core.ts'
 * and filtering the "good" configurations.
 *
 * TODO I'm not really happy with how the code looks like.
 * It feels that the CachedConfigurationsProcessor is lying to the users,
 * because it sometimes use the info from the nested plannerCore,
 * and sometimes from the given FullGameState.
 * Perhaps I should split between CachedState and UncachedState, or something analogous
 * (kinda like the old PersistentState and TransientState).
 * And I really hope updateCoreIfCompatible does not invalidate the suspended iterator.
 */

import {
    LumpType,
    PantheonSlot,
    BudgetInfo,
    PlannerRelevantState,
    DragonAuraReportEntry,
    PlannerReportEntry,
    SummaryPlannerReport,
    FullListPlannerReport,
    FullGameState,
} from './types';

import { DistilledPlannerConfiguration, rigidelPower, PlannerCore } from './core';

export function* mergeIterators<T>(iterators: Iterator<T>[], compare: (x: T, y: T) => number) {
    // We ignore the return value (from the first past-the-end iterator result)
    let values: T[] = [];
    let validIterators: Iterator<T>[] = [];
    for(let i = 0; i < iterators.length; i++) {
        let { value, done } = iterators[i].next();
        if(!done) {
            values.push(value);
            validIterators.push(iterators[i]);
        }
    }

    while(validIterators.length != 0) {
        let earliest = 0;
        for(let i = 1; i < validIterators.length; i++) {
            if(compare(values[i], values[earliest]) < 0)
                earliest = i;
        }
        yield values[earliest];

        let { value, done } = validIterators[earliest].next();
        if(done) {
            values.splice(earliest, 1);
            validIterators.splice(earliest, 1);
        } else {
            values[earliest] = value;
        }
    }
}

export const distilledConfigurationsCount = 2*2*1201;
export function makeConfigurationsIterator(core: PlannerCore) {
    let startGrandmaCount = core.hasSugarAgingProcess ? 1200 : 600;
    let step = core.hasSugarAgingProcess ? 1 : 200;
    function* makeIterator(hasDragonsCurve: boolean, hasRealityBending: boolean) {
        for(let i = startGrandmaCount; i >= 0; i -= step) {
            yield {effectiveGrandmaCount: i, hasDragonsCurve, hasRealityBending};
        }
    }
    let compare = (x: DistilledPlannerConfiguration, y: DistilledPlannerConfiguration) => {
        return core.overripeAge(x) - core.overripeAge(y);
    }

    return mergeIterators([
        makeIterator(false, false),
        makeIterator(false, true),
        makeIterator(true, false),
        makeIterator(true, true),
    ], compare);
}

export const canonicalIndicesCount = 2*2*1201;
export function canonicalIndex(configuration: DistilledPlannerConfiguration) {
    return 1201*((configuration.hasDragonsCurve ? 2 : 0) + (configuration.hasRealityBending ? 1 : 0))
        + configuration.effectiveGrandmaCount;
}

export type PartialConfiguration = {
    /* grandmaCount == null if and only if Sugar aging process was not bought.
     * Equivalent to 0 grandmas for autoharvestTimestamp calculation purposes.
     */
    grandmaCount: number | null;
    hasDragonsCurve: boolean;
    hasRealityBending: boolean;
    hasSupremeIntellect: boolean;
    rigidelSlot: PantheonSlot;
}
export type PlannerConfiguration = PartialConfiguration & {
    grandmapocalypseStages: [boolean, boolean, boolean, boolean],
    lumpType: LumpType,
    autoharvestTimestamp: number,
};

/* Maps the canonicalIndex of a distilled configuration
 * to a list PartialConfiguration[] of all compatible configurations.
 */
export const precomputedPartialConfigurations: PartialConfiguration[][] =
(() => {
    function distill(configuration: PartialConfiguration): DistilledPlannerConfiguration {
        let myRigidelPower = rigidelPower(configuration.rigidelSlot, configuration.hasSupremeIntellect);
        return {
            effectiveGrandmaCount: myRigidelPower + Math.min(600, configuration.grandmaCount ?? 0),
            hasDragonsCurve: configuration.hasDragonsCurve,
            hasRealityBending: configuration.hasRealityBending,
        };
    }

    let partialConfigurations: PartialConfiguration[][]
        = Array(canonicalIndicesCount).fill([]).map(() => []);
    let validGrandmaCounts = [null as null | number].concat(Array(601).fill(0).map((_, i) => i));
    for(let grandmaCount of validGrandmaCounts) {
        for(let rigidelSlot of ['none', 'jade', 'ruby', 'diamond'] as PantheonSlot[]) {
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

/* Translates the configuration into a PlannerReportEntry,
 * adding notes according to whether the elements in the configuration
 * match the current game state of the given plannerCore.
 */
export function makeReportEntry(options: {
    configuration: PlannerConfiguration,
    plannerCore: PlannerCore,
    threeColumnDragonAuras: boolean
}): PlannerReportEntry {
    let { configuration, plannerCore, threeColumnDragonAuras } = options;
    function check(condition: boolean): 'checkmark' | '' {
        return condition ? 'checkmark' : '';
    }
    // TODO here is probably not the best place to handle nullable grandma counts
    let plannerCoreEquivalentGrandmaCount = plannerCore.hasSugarAgingProcess ? plannerCore.currentGrandmaCount : null;

    let selectedEntry = configuration.grandmaCount == plannerCoreEquivalentGrandmaCount
        && configuration.hasDragonsCurve == plannerCore.currentHasDragonsCurve
        && configuration.hasRealityBending == plannerCore.currentHasRealityBending
        && configuration.hasSupremeIntellect == plannerCore.currentHasSupremeIntellect
        && configuration.rigidelSlot == plannerCore.currentRigidelSlot
        && configuration.grandmapocalypseStages[plannerCore.currentGrandmapocalypseStage];
    let lumpType = configuration.lumpType;
    let autoharvestTimestamp = configuration.autoharvestTimestamp;
    let grandmapocalypseStages = configuration.grandmapocalypseStages;
    let grandmapocalypseNote = check(configuration.grandmapocalypseStages[plannerCore.currentGrandmapocalypseStage]);
    let rigidelSlot = configuration.rigidelSlot;
    let rigidelNote = check(configuration.rigidelSlot == plannerCore.currentRigidelSlot);

    let grandmaCount = configuration.grandmaCount;
    let grandmaCountNote: 'checkmark' | 'warn' | '';
    if(grandmaCount == null && plannerCore.hasSugarAgingProcess) {
        grandmaCountNote = 'warn';
    } else if(grandmaCount != null && !plannerCore.hasSugarAgingProcess) {
        grandmaCountNote = 'warn';
        /* NOTE: Currently,
         * CachedConfigurationsProcessor.prototype.cacheNextPredictionSet() filters these two cases out,
         * so grandmaCountNote should never be 'warn' in any report produced by CachedConfigurationsProcessor.
         */
    } else if(grandmaCount == null && !plannerCore.hasSugarAgingProcess) {
        grandmaCountNote = 'checkmark'; // Grandmas are not displayed by lumpTooltip.ts in this case
    } else {
        grandmaCountNote = grandmaCount == plannerCore.currentGrandmaCount ? 'checkmark' : '';
    }

    let dragonAuras: DragonAuraReportEntry[] = [];
    if(threeColumnDragonAuras) { // Easy
        dragonAuras.push({
            aura: "Dragon's Curve",
            style: configuration.hasDragonsCurve ? 'normal' : 'faded',
            note: check(configuration.hasDragonsCurve == plannerCore.currentHasDragonsCurve),
        });
        dragonAuras.push({
            aura: "Reality Bending",
            style: configuration.hasRealityBending? 'normal' : 'faded',
            note: check(configuration.hasRealityBending == plannerCore.currentHasRealityBending),
        });
        dragonAuras.push({
            aura: "Supreme Intellect",
            style: configuration.hasSupremeIntellect? 'normal' : 'faded',
            note: check(configuration.hasSupremeIntellect == plannerCore.currentHasSupremeIntellect),
        });
    } else { // Oh no
        if(configuration.hasDragonsCurve) {
            dragonAuras.push({
                aura: "Dragon's Curve",
                style: 'normal',
                note: check(configuration.hasDragonsCurve == plannerCore.currentHasDragonsCurve),
            });
        }
        if(configuration.hasRealityBending) {
            dragonAuras.push({
                aura: "Reality Bending",
                style: 'normal',
                note: check(configuration.hasRealityBending == plannerCore.currentHasRealityBending),
            });
        }
        if(configuration.hasSupremeIntellect) {
            dragonAuras.push({
                aura: "Supreme Intellect",
                style: 'normal',
                note: check(configuration.hasSupremeIntellect == plannerCore.currentHasSupremeIntellect),
            });
        }

        if(dragonAuras.length <= 1) {
            // There's still space left, let's try warning the player about wrongly placed auras
            if(!configuration.hasDragonsCurve && plannerCore.currentHasDragonsCurve) {
                dragonAuras.push({
                    aura: "Dragon's Curve",
                    style: 'faded',
                    note: 'warn',
                });
            }
            if(!configuration.hasRealityBending && plannerCore.currentHasRealityBending) {
                dragonAuras.push({
                    aura: "Reality Bending",
                    style: 'faded',
                    note: 'warn',
                });
            }
            if(!configuration.hasSupremeIntellect && plannerCore.currentHasSupremeIntellect
                && configuration.rigidelSlot != 'none' && configuration.rigidelSlot != 'diamond')
            {
                // Supreme Intellect is displacing Rigidel
                dragonAuras.push({
                    aura: "Supreme Intellect",
                    style: 'faded',
                    note: 'warn',
                });
            }
            dragonAuras = dragonAuras.slice(0, 2);
        }

        if(dragonAuras.length <= 1) {
            // Nothing to warn, nothing to display, so we pad with faded Dragon's Curve & Reality Bending
            if(dragonAuras.length == 0 || dragonAuras[0].aura != "Dragon's Curve") {
                dragonAuras.push({
                    aura: "Dragon's Curve",
                    style: 'faded',
                    note: 'checkmark',
                });
            }
            if(dragonAuras[0].aura == "Dragon's Curve") {
                dragonAuras.push({
                    aura: "Reality Bending",
                    style: 'faded',
                    note: 'checkmark',
                });
            }
        }
    }

    return {
        selectedEntry,
        lumpType,
        autoharvestTimestamp,
        grandmaCount,
        grandmaCountNote,
        grandmapocalypseStages,
        grandmapocalypseNote,
        dragonAuras,
        rigidelSlot,
        rigidelNote,
    };
}

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
        if(configuration.grandmaCount != null && configuration.grandmaCount > budget.maxGrandmas) return false;
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

/* Returns the list of requirements and goals specified by the filtering preferences.
 * The "goals" array always contains at least the always-accepting filter.
 *
 * Additionally, if both preserveDragon and preservePantheon are 'observe',
 * also adds a goal preserving both at the same time.
 */
export function makeFilterCollection(fullState: FullGameState):
    {requirements: ConfigurationFilter[], goals: ConfigurationFilter[]}
{
    let requirements = [] as ConfigurationFilter[];
    let goals = [] as ConfigurationFilter[];
    goals.push(makeTrivialConfigurationFilter());
    let conditions = fullState.preferences.conditions;
    let dragonPreserver = makeDragonPreservingConfigurationFilter(fullState.gameState);
    let pantheonPreserver = makePantheonPreservingConfigurationFilter(fullState.gameState);
    let grandmapocalypsePreserver = makeGrandmapocalypseStagePreservingFilter(fullState.gameState);
    let budgetRespecter = makeBudgetConsciousFilter(fullState.budget);

    if(conditions.preserveDragon == 'require') {
        requirements.push(dragonPreserver);
    }
    if(conditions.preservePantheon == 'require') {
        requirements.push(pantheonPreserver);
    }
    if(conditions.preserveGrandmapocalypseStage == 'require') {
        requirements.push(grandmapocalypsePreserver);
    }
    if(conditions.respectBudget == 'require') {
        requirements.push(budgetRespecter);
    }

    if(conditions.preserveDragon == 'observe') {
        goals.push(dragonPreserver);
    }
    if(conditions.preservePantheon == 'observe') {
        goals.push(pantheonPreserver);
    }
    if(conditions.preserveGrandmapocalypseStage == 'observe') {
        goals.push(grandmapocalypsePreserver);
    }
    if(conditions.respectBudget == 'observe') {
        goals.push(budgetRespecter);
    }

    // Special condition
    if(conditions.preserveDragon == 'observe' && conditions.preservePantheon == 'observe') {
        goals.push(makeIntersectionFilter(dragonPreserver, pantheonPreserver));
    }

    return {requirements, goals};
}

/* Returns a list (satisfyingConfigurations, unsatisfiedGoals) with the following properties:
 * - unsatisfiedGoals is the sublist of goals which are not satisfied by any configuration;
 * - every configuration in satisfyingConfigurations satisfy at least one goal;
 * - a greedy algorithm is used to minimize the length of satisfyingConfigurations.
 */
export function matchConfigurationsToGoals(
    configurations: PlannerConfiguration[],
    goals: ConfigurationFilter[]
): {
    satisfyingConfigurations: PlannerConfiguration[],
    unsatisfiedGoals: ConfigurationFilter[],
} {
    let satisfyingConfigurations: PlannerConfiguration[] = [];
    let needsFurtherProcessing = true;
    while(needsFurtherProcessing) {
        let countOfGoalsAccepting = configurations.map(configuration => {
            return goals.map(goal => Number(goal(configuration))).reduce((x,y) => x+y, 0);
        });
        if(Math.max(...countOfGoalsAccepting) == 0) {
            needsFurtherProcessing = false;
        } else {
            let index = countOfGoalsAccepting.indexOf(Math.max(...countOfGoalsAccepting));
            satisfyingConfigurations.push(configurations[index]);
            goals = goals.filter(goal => !goal(configurations[index]));
            /* We added to successes one of the configurations satisfying the most goals,
             * and removed from goals the ones which are already satisfied.
             * It is possible that some goal is satisfied by some acceptable configuration,
             * but not by the one we just pushed to `successes`,
             * so we still need another round of processing for this list of configurations.
             */
        }
    }
    return {satisfyingConfigurations, unsatisfiedGoals: goals};
}

export class CachedConfigurationsProcessor {
    constructor(plannerCore: PlannerCore) {
        this.plannerCore = plannerCore;
        this.iterator = makeConfigurationsIterator(plannerCore);
    }

    /* Tells whether the given plannerCore is compatible with this object's PlannerCore,
     * for configuration processing purposes.
     */
    public isCacheCompatible(gameState: PlannerRelevantState) {
        return gameState.discrepancy == this.plannerCore.discrepancy &&
               gameState.hasSteviaCaelestis == this.plannerCore.hasSteviaCaelestis &&
               gameState.hasSucralosiaInutilis == this.plannerCore.hasSucralosiaInutilis &&
               gameState.hasSugarAgingProcess == this.plannerCore.hasSugarAgingProcess &&
               gameState.currentLumpT == this.plannerCore.currentLumpT &&
               gameState.seed == this.plannerCore.seed;
    }

    public updateCoreIfCompatible(newPlannerCore: PlannerCore) {
        if(this.isCacheCompatible(newPlannerCore)) {
            this.plannerCore = newPlannerCore;
            return true;
        } else {
            return false;
        }
    }

    // The attributes are public mainly for testing
    public plannerCore: PlannerCore;

    /* Suspended iterator.
     * It will navigate through all distilled configurations of plannerCore exactly once.
     * We will lazily call lumpTypePredictionSet for each of those configurations,
     * and store the results in `this.cache`.
     * It is set to null when finished.
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
        let autoharvestTimestamp = this.plannerCore.autoharvestTimestamp(next.value);
        let predictionSet = this.plannerCore.lumpTypePredictionSet(next.value);
        let hasSugarAgingProcess = this.plannerCore.hasSugarAgingProcess;
        for(let lumpType of new Set(predictionSet)) {
            let matchingGrandmapocalypseStages = predictionSet.map(type => type == lumpType);
            let configurations = precomputedPartialConfigurations[canonicalIndex(next.value)]
                .map((partialConfiguration:PartialConfiguration): PlannerConfiguration | null => {
                    // We filter out nulls at the end
                    if(!hasSugarAgingProcess && partialConfiguration.grandmaCount != null) return null;
                    if( hasSugarAgingProcess && partialConfiguration.grandmaCount == null) return null;

                    let grandmapocalypseStages = matchingGrandmapocalypseStages as [boolean, boolean, boolean, boolean];
                    if(hasSugarAgingProcess && partialConfiguration.grandmaCount == 0) {
                        // Cannot have grandmapocalypse if there are no grandmas
                        if(!grandmapocalypseStages[0]) {
                            return null;
                        } else {
                            grandmapocalypseStages = [grandmapocalypseStages[0], false, false, false];
                        }
                    }
                    return {
                        ...partialConfiguration,
                        lumpType,
                        autoharvestTimestamp,
                        grandmapocalypseStages,
                    };
                }).filter(c => c != null);
            this.cache[lumpType].push(configurations);
        }
        return true;
    }

    /* Makes an iterator that iterates through all PlannerConfiguration sets
     * matching the given lump type.
     * It uses and extends this object's cache.
     */
    public *makePlannerConfigurationIterator(lumpType: LumpType): Generator<PlannerConfiguration[]> {
        let i = 0;
        let cacheMightHaveBeenLengthened = true;
        while(cacheMightHaveBeenLengthened) {
            while(i < this.cache[lumpType].length) {
                yield this.cache[lumpType][i];
                i++;
                /* The cache length might be longer than just one extra value in two situations:
                 * 1. as soon as the iterator starts, if the cache already has some values;
                 * 2. if, after some yield, this iterator is suspended
                 *    and some other iterator lengthens the cache.
                 */
            }
            cacheMightHaveBeenLengthened = this.cacheNextPredictionSet();
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
        for(let configurationSet of this.makePlannerConfigurationIterator(options.targetLump)) {
            let acceptableConfigurations = configurationSet.filter(acceptable);
            if(acceptableConfigurations.length == 0) continue;
            let { satisfyingConfigurations, unsatisfiedGoals } =
                matchConfigurationsToGoals(acceptableConfigurations, goals);
            goals = unsatisfiedGoals;
            successes = successes.concat(satisfyingConfigurations);
            if(goals.length == 0)
                break;
        }
        return {successes, failures: goals};
    }

    public getSummaryPlannerReport(fullGameState: FullGameState): SummaryPlannerReport {
        if(!this.isCacheCompatible(fullGameState.gameState)) {
            throw new Error('fullGameState.gameState is not compatible with this.plannerCore');
        }
        let report: SummaryPlannerReport = {};
        let { requirements, goals } = makeFilterCollection(fullGameState);
        let lumpType: LumpType;
        for(lumpType in fullGameState.preferences.includeType) {
            if(fullGameState.preferences.includeType[lumpType]) {
                let out = this.getConfigurations({ targetLump: lumpType, requirements, goals });
                report[lumpType] = out.successes.map(configuration => makeReportEntry({
                    configuration,
                    plannerCore: this.plannerCore,
                    threeColumnDragonAuras: fullGameState.preferences.threeColumnDragonAuras
                }));
            }
        }
        return report;
    }

    public getFullListPlannerReport(fullGameState: FullGameState): FullListPlannerReport {
        if(!this.isCacheCompatible(fullGameState.gameState)) {
            throw new Error('fullGameState.gameState is not compatible with this.plannerCore');
        }
        while(this.cacheNextPredictionSet()) {
            // Who needs lazy computation??
        }

        let self = this;
        let { requirements, goals } = makeFilterCollection(fullGameState);
        let acceptable = makeIntersectionFilter(...requirements);
        function* makeIterator(lumpType: LumpType) {
            for(let configurationSet of self.makePlannerConfigurationIterator(lumpType)) {
                let configurations = configurationSet.filter(acceptable);
                if(configurations.length == 0) continue;
                // Prioritize satisfying configurations, but if there are none, pick one arbitrarily
                let { satisfyingConfigurations } = matchConfigurationsToGoals(configurations, goals);
                if(satisfyingConfigurations.length == 0)
                    satisfyingConfigurations.push(configurations[0]);
                yield satisfyingConfigurations;
            }
        }

        let iterators: Iterator<PlannerConfiguration[]>[] = [];
        let lumpType: LumpType;
        for(lumpType in fullGameState.preferences.includeType) {
            if(fullGameState.preferences.includeType[lumpType]) {
                iterators.push(makeIterator(lumpType));
            }
        }
        let report: FullListPlannerReport = [];
        for(let configurationSet of mergeIterators(iterators, (x, y) => x[0].autoharvestTimestamp - y[0].autoharvestTimestamp)) {
            report.push(configurationSet.map(configuration => makeReportEntry({
                configuration,
                plannerCore: this.plannerCore,
                threeColumnDragonAuras: fullGameState.preferences.threeColumnDragonAuras,
            })));
        }
        return report;
    }
};
