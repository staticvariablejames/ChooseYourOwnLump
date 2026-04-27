/* This file basically only contains the global preferences object.
 *
 * Fundamentally, this file exists to prevent issues with circular imports.
 * As such, the file is self-contained,
 * other than a type import from 'planner/types.ts'.
 */

import type { FilteringPreferences } from './planner/types';

export type CYOLPreferences = {
    discrepancy: number;
    display: {
        reportType: 'filtered' | 'fullList';
        rows: number;
        showCheckmark: boolean,
    },
    filtering: FilteringPreferences;
};

export function getDefaultPreferences(): CYOLPreferences {
    return {
        discrepancy: 1,
        display: {
            rows: 10,
            reportType: 'fullList',
            showCheckmark: true,
        },
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

/* The global preferences object.
 * We make sure this becomes CYOL.preferences in main.ts.
 *
 * ES modules use live bindings,
 * but when we let CYOL.preferences = preferences,
 * we create a copy of the reference to the global preferences object,
 * and this copy is not "alive" anymore.
 * Hence, if we were to reassign this object,
 * the reference in CYOL.preferences would not point to this object anymore.
 * Thus the use of `const`:
 * it prevents ourselves from reassigning the binding and invalidating CYOL.preferences.
 */
export const preferences = getDefaultPreferences();

/* Replace the entire `preferences` object with the new one.
 *
 * The replacement is done via Object.assign,
 * so references to `preferences` are always kept valid.
 *
 * This function is here largely because ECMAScript does not allow bindings to be reassigned.
 * This module directly exposes the preferences object above,
 * so there is no need for a corresponding getPreferences.
 */
export function setPreferences(newPreferences: CYOLPreferences) {
    Object.assign(preferences, newPreferences);
}
