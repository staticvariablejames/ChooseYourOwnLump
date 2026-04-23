/* settings.ts
 * Contains the `settings` object and utilities for querying it.
 */

import { version } from '../modInfo';

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
    let newSettings = saveObject.settings ?? {};
    // TODO: if(saveObject.version != version) announceNewVersion()

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

export function targetTypes() {
    let types = [];
    if(settings.includeNormal) types.push('normal');
    if(settings.includeBifurcated) types.push('bifurcated');
    if(settings.includeGolden) types.push('golden');
    if(settings.includeMeaty) types.push('meaty');
    if(settings.includeCaramelized) types.push('caramelized');
    return types;
}
