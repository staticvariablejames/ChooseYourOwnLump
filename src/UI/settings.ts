/* settings.ts
 * Contains the `settings` object and utilities for querying it.
 */

export let settings = { // default settings
    discrepancy: 1,
    includeNormal: false,
    includeBifurcated: false,
    includeGolden: true,
    includeMeaty: false,
    includeCaramelized: false,
    preserveGrandmapocalypseStage: false,
    preserveDragon: false,
    preservePantheon: false,
    rowsToDisplay: 10,
};

/* Copies the given settings object to settings,
 * enforcing that the objects have their appropriate types.
 */
export function copySettings(newSettings: any) {
    if(!newSettings) return;
    let numericSettings = ['discrepancy', 'rowsToDisplay'];
    let booleanSettings = [
        'includeNormal', 'includeBifurcated', 'includeGolden', 'includeMeaty', 'includeCaramelized',
        'preserveGrandmapocalypseStage', 'preserveDragon', 'preservePantheon'
    ];

    for(let key of numericSettings) {
        if(key in newSettings) (settings as any)[key] = Number(newSettings[key]);
    }
    for(let key of booleanSettings) {
        if(key in newSettings) (settings as any)[key] = Boolean(newSettings[key]);
    }
}

/* Returns the discrepancy,
 * unless the Spiced Cookies discrepancy patch is detected,
 * in which it returns 0.
 */
export function effectiveDiscrepancy() {
    if(typeof Spice !== 'undefined' && Spice?.settings?.patchDiscrepancy) return 0;
    return settings.discrepancy;
}

export function targetTypes() {
    let types = [];
    if(settings.includeNormal) types.push('normal');
    if(settings.includeBifurcated) types.push('bifurcated');
    if(settings.includeGolden) types.push('golden');
    if(settings.includeMeaty) types.push('meaty');
    if(settings.includeCaramelized) types.push('caramelized');
    return types;
}
