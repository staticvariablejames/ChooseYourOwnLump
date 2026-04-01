/* Tools for iterating through all configurations defined in 'core.ts'
 * and filtering the "good" configurations.
 */

import { DistilledPlannerConfiguration, PlannerRelevantState } from './core';

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
