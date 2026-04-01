/* Tools for iterating through all configurations defined in 'core.ts'
 * and filtering the "good" configurations.
 */

import { LumpType, PantheonSlot } from './types';
import { DistilledPlannerConfiguration, rigidelPower, PlannerRelevantState } from './core';

export function* makeConfigurationsIterator(planner: PlannerRelevantState) {
    let startGrandmaCount = planner.hasSugarAgingProcess ? 1200 : 600;
    let configurations: DistilledPlannerConfiguration[] = [
        {effectiveGrandmaCount: startGrandmaCount, hasDragonsCurve: false, hasRealityBending: false},
        {effectiveGrandmaCount: startGrandmaCount, hasDragonsCurve: false, hasRealityBending: true},
        {effectiveGrandmaCount: startGrandmaCount, hasDragonsCurve: true,  hasRealityBending: false},
        {effectiveGrandmaCount: startGrandmaCount, hasDragonsCurve: true,  hasRealityBending: true},
    ];
    while(configurations.length != 0) {
        let earliest = 0;
        for(let i = 1; i < configurations.length; i++) {
            if(planner.overripeAge(configurations[i]) < planner.overripeAge(configurations[earliest]))
                earliest = i;
        }
        yield {...configurations[earliest]};

        if(planner.hasSugarAgingProcess) {
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
    grandmapocalypseStage: [boolean, boolean, boolean, boolean],
    lumpType: LumpType,
};

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
