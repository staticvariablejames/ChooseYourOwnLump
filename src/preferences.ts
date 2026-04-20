/* This file basically only contains the global preferences object.
 *
 * Fundamentally, this file exists to prevent issues with circular imports.
 * As such, the file is self-contained,
 * other than a type import from 'planner/types.ts'.
 */

import type { FilteringPreferences } from './planner/types';

export type CYOLPreferences = {
    filtering: FilteringPreferences;
    reportType: 'filtered' | 'fullList';
    discrepancy: number;
    rowsToDisplay: number;
};

export function getDefaultPreferences(): CYOLPreferences {
    return {
        discrepancy: 1,
        rowsToDisplay: 10,
        reportType: 'filtered',
        filtering: {
            threeColumnDragonAuras: false,
            conditions: {
                preserveDragon: 'observe',
                preservePantheon: 'observe',
                preserveGrandmapocalypseStage: 'observe',
                respectBudget: 'observe',
            },
            includeType: {
                normal: false,
                bifurcated: false,
                golden: true,
                meaty: false,
                caramelized: true,
            },
        },
    };
}

// We make sure this becomes CYOL.preferences in main.ts
export let preferences = getDefaultPreferences();
