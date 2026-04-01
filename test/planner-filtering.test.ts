import { test, expect } from '@playwright/test';
import { PlannerRelevantState, DistilledPlannerConfiguration } from '../src/planner/core';
import { makeConfigurationsIterator } from '../src/planner/filtering';

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
