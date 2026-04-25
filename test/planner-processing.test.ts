import { test, expect } from '@playwright/test';
import type { FullGameState } from '../src/planner/types';
import { getDefaultPreferences } from '../src/preferences';
import { PlannerCore, DistilledPlannerConfiguration } from '../src/planner/core';
import {
    makeConfigurationsIterator,
    canonicalIndex,
    canonicalIndicesCount,
    PartialConfiguration,
    precomputedPartialConfigurations,
    makeReportEntry,
    makeTrivialConfigurationFilter,
    makeDragonPreservingConfigurationFilter,
    makePantheonPreservingConfigurationFilter,
    makeIntersectionFilter,
    CachedConfigurationsProcessor,
} from '../src/planner/processing';

test.describe('Iteration', () => {
    test('produces the correct number of configurations', () => {
        function configurationCount(...plannerState: ConstructorParameters<typeof PlannerCore>) {
            let count = 0;
            let planner = new PlannerCore(...plannerState);
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
        function firstFailure(...plannerState: ConstructorParameters<typeof PlannerCore>) {
            let previousConfiguration: DistilledPlannerConfiguration | null = null;
            let planner = new PlannerCore(...plannerState);
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
    let plannerState = new PlannerCore({hasSugarAgingProcess: true});
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

test.describe('makeReportEntry', () => {
    test('works with normal values', () => {
        expect(makeReportEntry({
            configuration: {
                grandmaCount: 255, grandmapocalypseStages: [false, true, false, true], lumpType: 'caramelized', autoharvestTimestamp: 1.6e12,
                rigidelSlot: 'none',
                hasDragonsCurve: true,
                hasRealityBending: false,
                hasSupremeIntellect: true,
            },
            plannerCore: new PlannerCore({
                hasSugarAgingProcess: true,
                currentGrandmaCount: 254,
                currentRigidelSlot: 'ruby',
                currentHasDragonsCurve: true,
                currentHasRealityBending: true,
                currentHasSupremeIntellect: false,
                currentGrandmapocalypseStage: 1,
            }),
            threeColumnDragonAuras: true,
        })).toEqual({
            selectedEntry: false,
            lumpType: 'caramelized',
            autoharvestTimestamp: 1.6e12,
            grandmaCount: 255,
            grandmaCountNote: '',
            grandmapocalypseStages: [false, true, false, true],
            grandmapocalypseNote: 'checkmark',
            dragonAuras: [
                {aura: "Dragon's Curve",    style: 'normal', note: 'checkmark'},
                {aura: "Reality Bending",   style: 'faded', note: ''},
                {aura: "Supreme Intellect", style: 'normal', note: ''},
            ],
            rigidelSlot: 'none',
            rigidelNote: '',
        });

        expect(makeReportEntry({
            configuration: {
                grandmaCount: 255, grandmapocalypseStages: [false, true, false, true], lumpType: 'golden', autoharvestTimestamp: 1.6e12,
                rigidelSlot: 'ruby',
                hasDragonsCurve: false,
                hasRealityBending: true,
                hasSupremeIntellect: true,
            },
            plannerCore: new PlannerCore({
                hasSugarAgingProcess: true,
                currentGrandmaCount: 255,
                currentRigidelSlot: 'ruby',
                currentHasDragonsCurve: false,
                currentHasRealityBending: true,
                currentHasSupremeIntellect: true,
                currentGrandmapocalypseStage: 1,
            }),
            threeColumnDragonAuras: false,
        })).toEqual({
            selectedEntry: true,
            lumpType: 'golden',
            autoharvestTimestamp: 1.6e12,
            grandmaCount: 255,
            grandmaCountNote: 'checkmark',
            grandmapocalypseStages: [false, true, false, true],
            grandmapocalypseNote: 'checkmark',
            dragonAuras: [
                {aura: "Reality Bending",   style: 'normal', note: 'checkmark'},
                {aura: "Supreme Intellect", style: 'normal', note: 'checkmark'},
            ],
            rigidelSlot: 'ruby',
            rigidelNote: 'checkmark',
        });
    });

    test('properly compressing entries', () => {
        let baseConfiguration = {
            grandmaCount: 0,
            grandmapocalypseStages: [false, false, false, false] as [boolean, boolean, boolean, boolean],
            lumpType: 'normal' as 'normal',
            autoharvestTimestamp: 1.6e12,
            hasDragonsCurve: false,
            hasRealityBending: false,
            hasSupremeIntellect: false,
            rigidelSlot: 'ruby' as 'ruby',
        };

        expect(makeReportEntry({
            configuration: {...baseConfiguration,
                hasDragonsCurve: true,
                hasSupremeIntellect: true,
            },
            plannerCore: new PlannerCore({
                currentHasRealityBending: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Dragon's Curve", style: 'normal', note: ''},
            {aura: "Supreme Intellect", style: 'normal', note: ''},
        ]);

        expect(makeReportEntry({
            configuration: {...baseConfiguration,
                hasRealityBending: true,
                hasSupremeIntellect: true,
            },
            plannerCore: new PlannerCore({
                currentHasRealityBending: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Reality Bending", style: 'normal', note: 'checkmark'},
            {aura: "Supreme Intellect", style: 'normal', note: ''},
        ]);

        expect(makeReportEntry({
            configuration: {...baseConfiguration,
                hasSupremeIntellect: true,
            },
            plannerCore: new PlannerCore({
                currentHasSupremeIntellect: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Supreme Intellect", style: 'normal', note: 'checkmark'},
            {aura: "Dragon's Curve", style: 'faded', note: 'checkmark'},
        ]);

        expect(makeReportEntry({
            configuration: {...baseConfiguration,
                hasRealityBending: true,
            },
            plannerCore: new PlannerCore({
                currentHasDragonsCurve: true,
                currentHasSupremeIntellect: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Reality Bending", style: 'normal', note: ''},
            {aura: "Dragon's Curve", style: 'faded', note: 'warn'},
        ]);

        expect(makeReportEntry({
            configuration: {...baseConfiguration,
                hasRealityBending: true,
            },
            plannerCore: new PlannerCore({
                currentHasSupremeIntellect: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Reality Bending", style: 'normal', note: ''},
            {aura: "Supreme Intellect", style: 'faded', note: 'warn'},
        ]);

        expect(makeReportEntry({
            configuration: {...baseConfiguration,
                hasDragonsCurve: true,
            },
            plannerCore: new PlannerCore({
                currentHasSupremeIntellect: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Dragon's Curve", style: 'normal', note: ''},
            {aura: "Supreme Intellect", style: 'faded', note: 'warn'},
        ]);

        // Should not warn about Supreme Intellect with unslotted Rigidel
        expect(makeReportEntry({
            configuration: {...baseConfiguration,
                hasDragonsCurve: true,
                rigidelSlot: 'none',
            },
            plannerCore: new PlannerCore({
                currentHasSupremeIntellect: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Dragon's Curve", style: 'normal', note: ''},
            {aura: "Reality Bending", style: 'faded', note: 'checkmark'},
        ]);

        // Nor with diamond-slotted rigidel
        expect(makeReportEntry({
            configuration: {...baseConfiguration,
                hasDragonsCurve: true,
                rigidelSlot: 'diamond',
            },
            plannerCore: new PlannerCore({
                currentHasSupremeIntellect: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Dragon's Curve", style: 'normal', note: ''},
            {aura: "Reality Bending", style: 'faded', note: 'checkmark'},
        ]);

        expect(makeReportEntry({
            configuration: baseConfiguration,
            plannerCore: new PlannerCore({
                currentHasSupremeIntellect: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Supreme Intellect", style: 'faded', note: 'warn'},
            {aura: "Dragon's Curve", style: 'faded', note: 'checkmark'},
        ]);

        expect(makeReportEntry({
            configuration: baseConfiguration,
            plannerCore: new PlannerCore({
                currentHasRealityBending: true,
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Reality Bending", style: 'faded', note: 'warn'},
            {aura: "Dragon's Curve", style: 'faded', note: 'checkmark'},
        ]);

        expect(makeReportEntry({
            configuration: baseConfiguration,
            plannerCore: new PlannerCore({
            }),
            threeColumnDragonAuras: false,
        }).dragonAuras).toEqual([
            {aura: "Dragon's Curve", style: 'faded', note: 'checkmark'},
            {aura: "Reality Bending", style: 'faded', note: 'checkmark'},
        ]);
    });
});

test.describe('CachedConfigurationsProcessor', () => {
    let plannerCore = new PlannerCore({
        hasSugarAgingProcess: true,
        seed: 'james',
        currentLumpT: 1.6e12+298939,
    });
    test('The test itself works', () => {
        /* Check that the first three iterations of the iterator produce what we expect it produces.
         * This is the first currentLumpT after 1.6e12 with
         *  - two different lump types for the earliest possible configuration;
         *  - three different lump types for the second earliest possible configuration: and
         *  - caramelized lump type is an outcome for the second earliest configuration.
         */
        let iterator = makeConfigurationsIterator(plannerCore);
        expect(plannerCore.lumpTypePredictionSet(iterator.next().value!)) // 600 grandmas
            .toEqual(['normal', 'meaty', 'meaty', 'meaty']);
        expect(plannerCore.lumpTypePredictionSet(iterator.next().value!)) // 599 grandmas
            .toEqual(['bifurcated', 'caramelized', 'meaty', 'meaty']);
        expect(plannerCore.lumpTypePredictionSet(iterator.next().value!)) // 598 grandmas
            .toEqual(['normal', 'normal', 'normal', 'normal']);
        expect(plannerCore.lumpTypePredictionSet(iterator.next().value!)) // 597 grandmas
            .toEqual(['normal', 'normal', 'normal', 'normal']);
        expect(plannerCore.lumpTypePredictionSet(iterator.next().value!)) // 596
            .toEqual(['normal', 'normal', 'normal', 'normal']);
        expect(plannerCore.lumpTypePredictionSet(iterator.next().value!)) // 595
            .toEqual(['normal', 'normal', 'normal', 'normal']);
        expect(plannerCore.lumpTypePredictionSet(iterator.next().value!)) // 594
            .toEqual(['normal', 'normal', 'normal', 'normal']);
        expect(plannerCore.lumpTypePredictionSet(iterator.next().value!)) // 593
            .toEqual(['normal', 'normal', 'normal', 'normal']);
        expect(plannerCore.lumpTypePredictionSet(iterator.next().value!)) // 592
            .toEqual(['normal', 'normal', 'normal', 'meaty']); // third meaty
    });

    test('cacheNextPredictionSet works', () => {
        let cachedProcessor = new CachedConfigurationsProcessor(plannerCore);
        cachedProcessor.cacheNextPredictionSet();
        expect(cachedProcessor.cache['normal'].length).toEqual(1);
        expect(cachedProcessor.cache['normal'][0]).toEqual([
            {grandmaCount: 600, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [true, false, false, false], lumpType: 'normal', autoharvestTimestamp: 1600075557706.7725}
        ]);
        expect(cachedProcessor.cache['bifurcated'].length).toEqual(0);
        expect(cachedProcessor.cache['golden'].length).toEqual(0);
        expect(cachedProcessor.cache['meaty'].length).toEqual(1);
        expect(cachedProcessor.cache['meaty'][0]).toEqual([
            {grandmaCount: 600, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [false, true, true, true], lumpType: 'meaty', autoharvestTimestamp: 1600075557706.7725}
        ]);
        expect(cachedProcessor.cache['caramelized'].length).toEqual(0);

        cachedProcessor.cacheNextPredictionSet();
        expect(cachedProcessor.cache['normal'].length).toEqual(1);
        expect(cachedProcessor.cache['bifurcated'].length).toEqual(1);
        expect(cachedProcessor.cache['bifurcated'][0]).toEqual([
            {grandmaCount: 599, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [true, false, false, false], lumpType: 'bifurcated', autoharvestTimestamp: 1600075563393.9763}
        ]);
        expect(cachedProcessor.cache['golden'].length).toEqual(0);
        expect(cachedProcessor.cache['meaty'].length).toEqual(2);
        expect(cachedProcessor.cache['meaty'][1]).toEqual([
            {grandmaCount: 599, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [false, false, true, true], lumpType: 'meaty', autoharvestTimestamp: 1600075563393.9763}
        ]);
        expect(cachedProcessor.cache['caramelized'].length).toEqual(1);
        expect(cachedProcessor.cache['caramelized'][0]).toEqual([
            {grandmaCount: 599, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [false, true, false, false], lumpType: 'caramelized', autoharvestTimestamp: 1600075563393.9763}
        ]);

        cachedProcessor.cacheNextPredictionSet();
        expect(cachedProcessor.cache['normal'].length).toEqual(2);
        expect(cachedProcessor.cache['normal'][1]).toEqual([
            {grandmaCount: 598, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600075569081.1802}
        ]);
        expect(cachedProcessor.cache['bifurcated'].length).toEqual(1);
        expect(cachedProcessor.cache['golden'].length).toEqual(0);
        expect(cachedProcessor.cache['meaty'].length).toEqual(2);
        expect(cachedProcessor.cache['caramelized'].length).toEqual(1);
    });

    test('makeConfigurationsIterator lazily walks through configurations', () => {
        let cachedProcessor = new CachedConfigurationsProcessor(plannerCore);
        let meatyIterator = cachedProcessor.makePlannerConfigurationIterator('meaty');
        let value, done;
        ({ value, done } = meatyIterator.next());
        expect(done).toBeFalsy();
        expect(value).toEqual([
            {grandmaCount: 600, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [false, true, true, true], lumpType: 'meaty', autoharvestTimestamp: 1600075557706.7725}
        ]);
        expect(cachedProcessor.cache['normal'].length).toEqual(1);
        expect(cachedProcessor.cache['bifurcated'].length).toEqual(0);
        expect(cachedProcessor.cache['golden'].length).toEqual(0);
        expect(cachedProcessor.cache['meaty'].length).toEqual(1);
        expect(cachedProcessor.cache['caramelized'].length).toEqual(0);

        ({ value, done } = meatyIterator.next());
        expect(done).toBeFalsy();
        expect(cachedProcessor.cache['normal'].length).toEqual(1);
        expect(cachedProcessor.cache['bifurcated'].length).toEqual(1);
        expect(cachedProcessor.cache['golden'].length).toEqual(0);
        expect(cachedProcessor.cache['meaty'].length).toEqual(2);
        expect(cachedProcessor.cache['caramelized'].length).toEqual(1);
        expect(value).toEqual([
            {grandmaCount: 599, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [false, false, true, true], lumpType: 'meaty', autoharvestTimestamp: 1600075563393.9763}
        ]);

        for(let caramelizedConfiguration of cachedProcessor.makePlannerConfigurationIterator('caramelized')) {
            // It should skip the first partialConfiguration and stop at the second
            expect(caramelizedConfiguration).toEqual([
                {grandmaCount: 599, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [false, true, false, false], lumpType: 'caramelized', autoharvestTimestamp: 1600075563393.9763}
            ]);
            expect(cachedProcessor.cache['normal'].length).toEqual(1);
            expect(cachedProcessor.cache['bifurcated'].length).toEqual(1);
            expect(cachedProcessor.cache['golden'].length).toEqual(0);
            expect(cachedProcessor.cache['meaty'].length).toEqual(2);
            expect(cachedProcessor.cache['caramelized'].length).toEqual(1);
            break; // Important not to advance cachedProcessor further
        }

        // Suspend a 'normal' lump type iterator
        let normalIterator = cachedProcessor.makePlannerConfigurationIterator('normal');
        ({ value, done } = normalIterator.next());
        expect(value).toEqual([
            {grandmaCount: 600, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [true, false, false, false], lumpType: 'normal', autoharvestTimestamp: 1600075557706.7725}
        ]);
        expect(cachedProcessor.cache['normal'].length).toEqual(1);
        expect(cachedProcessor.cache['bifurcated'].length).toEqual(1);
        expect(cachedProcessor.cache['golden'].length).toEqual(0);
        expect(cachedProcessor.cache['meaty'].length).toEqual(2);
        expect(cachedProcessor.cache['caramelized'].length).toEqual(1);

        // Step till the next meaty lump
        ({ value, done } = meatyIterator.next());
        expect(done).toBeFalsy();
        expect(value).toEqual([
            {grandmaCount: 592, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [false, false, false, true], lumpType: 'meaty', autoharvestTimestamp: 1600075603204.4028}
        ]);
        expect(cachedProcessor.cache['normal'].length).toEqual(8);
        expect(cachedProcessor.cache['bifurcated'].length).toEqual(1);
        expect(cachedProcessor.cache['golden'].length).toEqual(0);
        expect(cachedProcessor.cache['meaty'].length).toEqual(3);
        expect(cachedProcessor.cache['caramelized'].length).toEqual(1);

        // Check normalIterator is still good
        ({ value, done } = normalIterator.next());
        expect(done).toBeFalsy();
        expect(value).toEqual([
            {grandmaCount: 598, hasDragonsCurve: true, hasRealityBending: true, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600075569081.1802}
        ]);
        expect(cachedProcessor.cache['normal'].length).toEqual(8);
        expect(cachedProcessor.cache['bifurcated'].length).toEqual(1);
        expect(cachedProcessor.cache['golden'].length).toEqual(0);
        expect(cachedProcessor.cache['meaty'].length).toEqual(3);
        expect(cachedProcessor.cache['caramelized'].length).toEqual(1);

        // Exhausting the cache
        let goldenLumpsCount = 0;
        for(let _ of cachedProcessor.makePlannerConfigurationIterator('golden'))
            goldenLumpsCount++;
        expect(goldenLumpsCount).toBe(11); // There are 11 distilled configurations for golden lumps
    });

    test.describe('getConfigurations', () => {
        test('works without options.requirements', () => {
            let plannerCore = new PlannerCore({
                hasSugarAgingProcess: true,
                seed: 'james',
                currentLumpT: 1.6e12,
            });
            let dragonPreservingFilter = makeDragonPreservingConfigurationFilter(plannerCore);
            let pantheonPreservingFilter = makePantheonPreservingConfigurationFilter(plannerCore);
            let { successes, failures } = new CachedConfigurationsProcessor(plannerCore).getConfigurations({
                targetLump: 'normal',
                requirements: [],
                goals: [
                    makeTrivialConfigurationFilter(),
                    dragonPreservingFilter,
                    pantheonPreservingFilter,
                    makeIntersectionFilter(dragonPreservingFilter, pantheonPreservingFilter),
                ]
            });
            expect(failures).toEqual([]);
            expect(successes).toEqual([ // order of returned values matters
                {grandmaCount: 600, hasDragonsCurve: true,  hasRealityBending: true,  hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600075258767.7725},
                {grandmaCount: 600, hasDragonsCurve: true,  hasRealityBending: true,  hasSupremeIntellect: false, rigidelSlot: 'none',    grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600078671090.0474},
                {grandmaCount: 600, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600079200000},
                {grandmaCount: 600, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'none',    grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600082800000},
            ]);
        });

        test('does not repeat configurations satisfying multiple requirements', () => {
            let plannerCore = new PlannerCore({
                hasSugarAgingProcess: true,
                seed: 'james',
                currentLumpT: 1.6e12,
                currentHasDragonsCurve: true,
                currentHasRealityBending: true,
            });
            let dragonPreservingFilter = makeDragonPreservingConfigurationFilter(plannerCore);
            let pantheonPreservingFilter = makePantheonPreservingConfigurationFilter(plannerCore);
            let { successes, failures } = new CachedConfigurationsProcessor(plannerCore).getConfigurations({
                targetLump: 'normal',
                requirements: [],
                goals: [
                    makeTrivialConfigurationFilter(),
                    dragonPreservingFilter,
                    pantheonPreservingFilter,
                    makeIntersectionFilter(dragonPreservingFilter, pantheonPreservingFilter),
                ]
            });
            expect(failures).toEqual([]);
            expect(successes).toEqual([
                {grandmaCount: 600, hasDragonsCurve: true,  hasRealityBending: true,  hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600075258767.7725},
                {grandmaCount: 600, hasDragonsCurve: true,  hasRealityBending: true,  hasSupremeIntellect: false, rigidelSlot: 'none',    grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600078671090.0474},
            ]);
        });

        test('respects options.requirements', () => {
            let plannerCore = new PlannerCore({
                hasSugarAgingProcess: true,
                seed: 'james',
                currentLumpT: 1.6e12,
            });
            let dragonPreservingFilter = makeDragonPreservingConfigurationFilter(plannerCore);
            let pantheonPreservingFilter = makePantheonPreservingConfigurationFilter(plannerCore);
            let { successes, failures } = new CachedConfigurationsProcessor(plannerCore).getConfigurations({
                targetLump: 'normal',
                requirements: [
                    dragonPreservingFilter,
                ],
                goals: [
                    makeTrivialConfigurationFilter(),
                    pantheonPreservingFilter,
                ]
            });
            expect(failures).toEqual([]);
            expect(successes).toEqual([
                {grandmaCount: 600, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'diamond', grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600079200000},
                {grandmaCount: 600, hasDragonsCurve: false, hasRealityBending: false, hasSupremeIntellect: false, rigidelSlot: 'none',    grandmapocalypseStages: [true, true, true, true], lumpType: 'normal', autoharvestTimestamp: 1600082800000},
            ]);
        });

        test('reports failures', () => {
            let plannerCore = new PlannerCore({
                hasSugarAgingProcess: true,
                seed: 'james',
                currentLumpT: 1.6e12+4, // First currentLumpT after 1.6e12 without golden lumps with no dragon auras
            });
            let dragonPreservingFilter = makeDragonPreservingConfigurationFilter(plannerCore);
            let pantheonPreservingFilter = makePantheonPreservingConfigurationFilter(plannerCore);
            let { successes, failures } = new CachedConfigurationsProcessor(plannerCore).getConfigurations({
                targetLump: 'golden',
                requirements: [
                ],
                goals: [
                    makeTrivialConfigurationFilter(),
                    dragonPreservingFilter,
                    pantheonPreservingFilter,
                ]
            });
            expect(failures).toEqual([
                dragonPreservingFilter,
            ]);
            expect(successes).toEqual([
                {grandmaCount: 234, hasDragonsCurve: true, hasRealityBending: false, hasSupremeIntellect: true,  rigidelSlot: 'ruby', grandmapocalypseStages: [true, false, false, false], lumpType: 'golden', autoharvestTimestamp: 1600077691432.5715},
                {grandmaCount: 476, hasDragonsCurve: true, hasRealityBending: true,  hasSupremeIntellect: false, rigidelSlot: 'none', grandmapocalypseStages: [true, true,  true,  true],  lumpType: 'golden', autoharvestTimestamp: 1600079376307.3176},
            ]);
        });

        test('reports multiple failures', () => {
            let plannerCore = new PlannerCore({
                hasSugarAgingProcess: true,
                seed: 'james',
                currentLumpT: 1.6e12+26799, // First currentLumpT after 1.6e12 without golden lumps
            });
            let trivialConfigurationFilter = makeTrivialConfigurationFilter();
            let dragonPreservingFilter = makeDragonPreservingConfigurationFilter(plannerCore);
            let pantheonPreservingFilter = makePantheonPreservingConfigurationFilter(plannerCore);
            let intersectionFilter = makeIntersectionFilter(dragonPreservingFilter, pantheonPreservingFilter);
            let { successes, failures } = new CachedConfigurationsProcessor(plannerCore).getConfigurations({
                targetLump: 'golden',
                requirements: [
                ],
                goals: [
                    trivialConfigurationFilter,
                    dragonPreservingFilter,
                    pantheonPreservingFilter,
                    intersectionFilter,
                ]
            });
            expect(failures).toEqual([
                trivialConfigurationFilter,
                dragonPreservingFilter,
                pantheonPreservingFilter,
                intersectionFilter,
            ]);
            expect(successes).toEqual([]);
        });
    });
});

test.describe('CachedConfigurationsProcessor reports', () => {
    let defaultState: FullGameState = {
        gameState: {
            discrepancy: 0,
            hasSteviaCaelestis: false,
            hasSucralosiaInutilis: false,
            hasSugarAgingProcess: false,
            seed: 'aaaaa',
            currentLumpT: 1.6e12,
            currentRigidelSlot: 'none',
            currentGrandmaCount: 0,
            currentGrandmapocalypseStage: 0,
            currentHasDragonsCurve: false,
            currentHasRealityBending: false,
            currentHasSupremeIntellect: false,
        },
        preferences: getDefaultPreferences().filtering,
        budget: {
            maxGrandmas: 600,
            unlockedPantheon: true,
            unlockedDragonsCurve: true,
            unlockedRealityBending: true,
            unlockedSupremeIntellect: true,
            unlockedSecondAura: true,
        },
    };

    test('a correct fullListReport', () => {
        // adversarially-constructed-states.ts: grandmaless-sad-seed-search
        let state = structuredClone(defaultState);
        state.gameState.seed = 'mesad';
        state.gameState.currentLumpT = 1.6e12 + 57;
        state.preferences.conditions.preserveDragon = 'ignore';
        state.preferences.conditions.preservePantheon = 'ignore';
        let processor = new CachedConfigurationsProcessor(new PlannerCore(state.gameState));
        let report = processor.getFullListPlannerReport(state);
        expect(report).toEqual([]);
        state.preferences.includeType.normal = true;
        report = processor.getFullListPlannerReport(state);
        expect(new Set(report.flat().map(c => c.lumpType))).toEqual(new Set(['normal']));
        expect(new Set(report.flat().map(c => c.grandmaCount))).toEqual(new Set([null]));
        expect(new Set(report.flat().map(c => c.grandmaCountNote))).toEqual(new Set(['']));
        expect(new Set(report.flat().map(c => c.grandmapocalypseStages).flat())).toEqual(new Set([true]));
        expect(new Set(report.flat().map(c => c.grandmapocalypseNote))).toEqual(new Set(['checkmark']));
        expect(report).toMatchObject([
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 78671090.0474, rigidelSlot: 'diamond', rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: '', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 79028571.4285, rigidelSlot: 'ruby',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Supreme Intellect", note: '', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 79808530.8057, rigidelSlot: 'ruby',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: '', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 80171428.5715, rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Supreme Intellect", note: '', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 80945971.564,  rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: '', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 81314285.7144, rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 82083412.3223, rigidelSlot: 'none',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: '', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 82405970.1492, rigidelSlot: 'ruby',    rigidelNote: '',          dragonAuras: [{aura: "Reality Bending",   note: '',          style: 'normal'}, {aura: "Supreme Intellect", note: '', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 82457142.8572, rigidelSlot: 'none',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 82800000,      rigidelSlot: 'ruby',    rigidelNote: '',          dragonAuras: [{aura: "Supreme Intellect", note: '',          style: 'normal'}, {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 83600000,      rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Reality Bending",   note: '',          style: 'normal'}, {aura: "Supreme Intellect", note: '', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 84000000,      rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Supreme Intellect", note: '',          style: 'normal'}, {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 84794029.8508, rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Reality Bending",   note: '',          style: 'normal'}, {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 85200000,      rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'},  {aura: "Reality Bending",   note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 85988059.7014, rigidelSlot: 'none',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Reality Bending",   note: '',          style: 'normal'}, {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: true,  autoharvestTimestamp: 1.6e12+57 + 86400000,      rigidelSlot: 'none',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'},  {aura: "Reality Bending",   note: 'checkmark', style: 'faded'}]}],
        ]);
    });

    test('a correct fullListReport with some longer sublists', () => {
        // adversarially-constructed-states.ts: grandmaless-sad-seed-search
        let state = structuredClone(defaultState);
        state.gameState.seed = 'mesad';
        state.gameState.currentLumpT = 1.6e12 + 57;
        state.gameState.currentRigidelSlot = 'ruby';
        state.gameState.currentHasRealityBending = true;
        state.preferences.includeType.normal = true;
        let processor = new CachedConfigurationsProcessor(new PlannerCore(state.gameState));
        let report = processor.getFullListPlannerReport(state);
        expect(new Set(report.flat().map(c => c.lumpType))).toEqual(new Set(['normal']));
        expect(new Set(report.flat().map(c => c.grandmaCount))).toEqual(new Set([null]));
        expect(new Set(report.flat().map(c => c.grandmaCountNote))).toEqual(new Set(['']));
        expect(new Set(report.flat().map(c => c.grandmapocalypseStages).flat())).toEqual(new Set([true]));
        expect(new Set(report.flat().map(c => c.grandmapocalypseNote))).toEqual(new Set(['checkmark']));
        expect(report).toMatchObject([
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 78671090.0474, rigidelSlot: 'diamond', rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'checkmark', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 79028571.4285, rigidelSlot: 'ruby',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Supreme Intellect", note: '', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 79808530.8057, rigidelSlot: 'ruby',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'checkmark', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 80171428.5715, rigidelSlot: 'ruby',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'warn', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 80945971.564,  rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'checkmark', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 81314285.7144, rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'warn', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 82083412.3223, rigidelSlot: 'none',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'checkmark', style: 'normal'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 82405970.1492, rigidelSlot: 'ruby',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Reality Bending",   note: 'checkmark', style: 'normal'}, {aura: "Supreme Intellect", note: '', style: 'normal'}]},
             {selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 82405970.1492, rigidelSlot: 'diamond', rigidelNote: '',          dragonAuras: [{aura: "Reality Bending",   note: 'checkmark', style: 'normal'}, {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 82457142.8572, rigidelSlot: 'none',    rigidelNote: '',          dragonAuras: [{aura: "Dragon's Curve",    note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'warn', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 82800000,      rigidelSlot: 'ruby',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Supreme Intellect", note: '',          style: 'normal'}, {aura: "Reality Bending",   note: 'warn', style: 'faded'}]}],
            [{selectedEntry: true,  autoharvestTimestamp: 1.6e12+57 + 83600000,      rigidelSlot: 'ruby',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Reality Bending",   note: 'checkmark', style: 'normal'}, {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 84000000,      rigidelSlot: 'ruby',    rigidelNote: 'checkmark', dragonAuras: [{aura: "Reality Bending",   note: 'warn',      style: 'faded'},  {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 84794029.8508, rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Reality Bending",   note: 'checkmark', style: 'normal'}, {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 85200000,      rigidelSlot: 'jade',    rigidelNote: '',          dragonAuras: [{aura: "Reality Bending",   note: 'warn',      style: 'faded'},  {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 85988059.7014, rigidelSlot: 'none',    rigidelNote: '',          dragonAuras: [{aura: "Reality Bending",   note: 'checkmark', style: 'normal'}, {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
            [{selectedEntry: false, autoharvestTimestamp: 1.6e12+57 + 86400000,      rigidelSlot: 'none',    rigidelNote: '',          dragonAuras: [{aura: "Reality Bending",   note: 'warn',      style: 'faded'},  {aura: "Dragon's Curve",    note: 'checkmark', style: 'faded'}]}],
        ]);
    });
});
