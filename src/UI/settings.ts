/* settings.ts
 * Contains the `settings` object and utilities for querying it.
 */

import { version } from '../mod';

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

/* Load settings from the given save game string.
 * enforcing that the objects have their appropriate types.
 *
 * Any nonexistent attributes are ignored.
 */
export function loadSettingsFrom(save: string) {
    let saveObject = JSON.parse(save);
    if(typeof saveObject !== "object") return;
    let newSettings: object;

    if('version' in saveObject) {
        newSettings = saveObject.settings ?? {};
        // TODO: if(saveObject.version != version) announceNewVersion()
    } else {
        // legacy save format (1.2.7 and earlier)
        newSettings = saveObject;
    }

    let key: keyof typeof settings;
    for(key in settings) {
        if(!(key in newSettings)) continue;
        //@ts-ignore: Type 'number' is not assignable to type 'never'.
        if(typeof settings[key] == 'number') settings[key] = Number(newSettings[key]);
        //@ts-ignore: Type 'boolean' is not assignable to type 'never'.
        if(typeof settings[key] == 'boolean') settings[key] = Boolean(newSettings[key]);
    }
}

export function exportSettings() {
    return JSON.stringify({
        version: version,
        settings: settings,
    });
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
