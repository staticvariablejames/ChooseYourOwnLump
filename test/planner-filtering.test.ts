import { test, expect } from '@playwright/test';
import { PlannerRelevantState, DistilledPlannerConfiguration } from '../src/planner/core';
import {
    makeConfigurationsIterator,
    canonicalIndex,
    canonicalIndicesCount,
    PartialConfiguration,
    precomputedPartialConfigurations,
} from '../src/planner/filtering';

test.describe('Iteration', () => {
    test('produces the correct number of configurations', () => {
        function configurationCount(...plannerState: ConstructorParameters<typeof PlannerRelevantState>) {
            let count = 0;
            let planner = new PlannerRelevantState(...plannerState);
            for(let _configuration of makeConfigurationsIterator(planner)) {
                count++;
            }
            return count;
        }
        expect(configurationCount({
            hasSugarAgingProcess: false,
        })).toEqual(2*2*4);

        expect(configurationCount({
            hasSugarAgingProcess: true,
        })).toEqual(2*2*1201);

        expect(configurationCount({
            hasSugarAgingProcess: true,
            currentHasDragonsCurve: true,
        })).toEqual(2*2*1201);

        expect(configurationCount({
            hasSugarAgingProcess: true,
            currentHasRealityBending: true,
        })).toEqual(2*2*1201);

        expect(configurationCount({
            hasSugarAgingProcess: true,
            currentHasSupremeIntellect: true,
        })).toEqual(2*2*1201);

        expect(configurationCount({
            hasSugarAgingProcess: false,
            currentHasSupremeIntellect: true,
        })).toEqual(2*2*4);
    });

    test('produces configurations in ascending overripeAge order', () => {
        function firstFailure(...plannerState: ConstructorParameters<typeof PlannerRelevantState>) {
            let previousConfiguration: DistilledPlannerConfiguration | null = null;
            let planner = new PlannerRelevantState(...plannerState);
            for(let configuration of makeConfigurationsIterator(planner)) {
                if(previousConfiguration) {
                    let previousOverripeAge = planner.overripeAge(previousConfiguration);
                    let currentOverripeAge = planner.overripeAge(configuration);
                    if(currentOverripeAge < previousOverripeAge) {
                        return {
                            previous: [previousOverripeAge, previousConfiguration],
                            current: [currentOverripeAge, configuration],
                        }
                    }
                }
                previousConfiguration = configuration;
            }
            return null;
        }
        expect(firstFailure({
            hasSugarAgingProcess: false,
        })).toBeNull();

        expect(firstFailure({
            hasSugarAgingProcess: true,
        })).toBeNull();

        expect(firstFailure({
            hasSugarAgingProcess: true,
            hasSteviaCaelestis: true,
        })).toBeNull();

        expect(firstFailure({
            hasSugarAgingProcess: true,
            currentHasRealityBending: true,
        })).toBeNull();
    });
});

test('canonicalIndex is a bijection', () => {
    let indices = new Array(canonicalIndicesCount).fill(false);
    let plannerState = new PlannerRelevantState({hasSugarAgingProcess: true});
    for(let configuration of makeConfigurationsIterator(plannerState)) {
        indices[canonicalIndex(configuration)] = true;
    }
    let firstFailure = '';
    for(let i = 0; i < canonicalIndicesCount; i++) {
        if(indices[i] !== true) firstFailure = `${i} is not an index`;
        break;
    }
    expect(firstFailure).toEqual('');
});

test.describe('precomputedPartialConfigurations is correctly initialized', () => {
    test('with the right number of configurations', () => {
        let totalPrecomputedPartialConfigurations =
            precomputedPartialConfigurations.map(l => l.length).reduce((x, y) => x+y);
        expect(totalPrecomputedPartialConfigurations).toEqual(601*7*4);
    });

    let distilledConfiguration: DistilledPlannerConfiguration;
    let partialConfigurations: PartialConfiguration[]; // Typecheck the tests themselves

    test('listing configurations including diamond-slotted Rigidel', () => {
        distilledConfiguration = {effectiveGrandmaCount: 666, hasDragonsCurve: true, hasRealityBending: false};
        partialConfigurations = [
            {grandmaCount: 466, hasDragonsCurve: true, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'jade'},
            {grandmaCount: 266, hasDragonsCurve: true, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'ruby'},
            {grandmaCount: 266, hasDragonsCurve: true, hasRealityBending: false, hasSupremeIntellect: true,  rigidelSlot: 'jade'},
            {grandmaCount: 66,  hasDragonsCurve: true, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'diamond'},
            {grandmaCount: 66,  hasDragonsCurve: true, hasRealityBending: false, hasSupremeIntellect: true,  rigidelSlot: 'ruby'},
            {grandmaCount: 66,  hasDragonsCurve: true, hasRealityBending: false, hasSupremeIntellect: true,  rigidelSlot: 'diamond'},
        ];
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)])
            .toEqual(expect.arrayContaining(partialConfigurations));
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)].length)
            .toEqual(partialConfigurations.length);
    });

    test('listing configurations with 1200 grandmas', () => {
        distilledConfiguration = {effectiveGrandmaCount: 1200, hasDragonsCurve: false, hasRealityBending: true};
        partialConfigurations = [
            {grandmaCount: 600, hasDragonsCurve: false, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond'},
            {grandmaCount: 600, hasDragonsCurve: false, hasRealityBending: true, hasSupremeIntellect: true,  rigidelSlot: 'diamond'},
            {grandmaCount: 600, hasDragonsCurve: false, hasRealityBending: true, hasSupremeIntellect: true,  rigidelSlot: 'ruby'},
        ];
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)])
            .toEqual(expect.arrayContaining(partialConfigurations));
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)].length)
            .toEqual(partialConfigurations.length);
    });

    test('listing configurations with a limited number of grandmas', () => {
        distilledConfiguration = {effectiveGrandmaCount: 55, hasDragonsCurve: false, hasRealityBending: false};
        partialConfigurations = [
            {grandmaCount: 55, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'none'},
            {grandmaCount: 55, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: true,  rigidelSlot: 'none'},
        ];
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)])
            .toEqual(expect.arrayContaining(partialConfigurations));
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)].length)
            .toEqual(partialConfigurations.length);
    });

    test('not listing configurations with three dragon auras', () => {
        distilledConfiguration = {effectiveGrandmaCount: 55, hasDragonsCurve: true, hasRealityBending: true};
        partialConfigurations = [
            {grandmaCount: 55, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'none'},
        ];
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)])
            .toEqual(expect.arrayContaining(partialConfigurations));
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)].length)
            .toEqual(partialConfigurations.length);
    });

    test('listing both with and without Supreme Intellect even if Rigidel is unslotted', () => {
        distilledConfiguration = {effectiveGrandmaCount: 555, hasDragonsCurve: false, hasRealityBending: false};
        partialConfigurations = [
            {grandmaCount: 555, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'none'},
            {grandmaCount: 555, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: true,  rigidelSlot: 'none'},
            {grandmaCount: 355, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'jade'},
            {grandmaCount: 155, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'ruby'},
            {grandmaCount: 155, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: true,  rigidelSlot: 'jade'},
        ];
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)])
            .toEqual(expect.arrayContaining(partialConfigurations));
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)].length)
            .toEqual(partialConfigurations.length);
    });

    test('but not listing configurations with Supreme Intellect if there is not enough auras', () => {
        distilledConfiguration = {effectiveGrandmaCount: 555, hasDragonsCurve: true, hasRealityBending: true};
        partialConfigurations = [
            {grandmaCount: 555, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'none'},
            {grandmaCount: 355, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'jade'},
            {grandmaCount: 155, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'ruby'},
        ];
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)])
            .toEqual(expect.arrayContaining(partialConfigurations));
        expect(precomputedPartialConfigurations[canonicalIndex(distilledConfiguration)].length)
            .toEqual(partialConfigurations.length);
    });
});
