/* Functions to read and write the save data.
 *
 * The two main exported functions are loadSaveData and serializeSaveData.
 *
 */

import type { CYOLPreferences } from './preferences';
import { preferences, setPreferences, getDefaultPreferences } from './preferences';
import { version } from './modInfo';

export type SaveData = {
    version: string, // Version used to create the save data
    preferences: CYOLPreferences,
};

// @ts-expect-error "no unused locals"; this type is here for documentation
type LegacySaveData = {
    version: string,
    settings: { // default settings
        discrepancy: number,
        includeNormal: boolean,
        includeBifurcated: boolean,
        includeGolden: boolean,
        includeMeaty: boolean,
        includeCaramelized: boolean,
        preserveGrandmapocalypseStage: boolean,
        preserveDragon: boolean,
        preservePantheon: boolean,
        rowsToDisplay: number,
    },
};

/* Parses the settings object from CYOL 1.3.2 and earlier.
 */
function loadSettingsFromLegacySave(legacyString: string) {
    let newPrefs = getDefaultPreferences();
    let legacySave = JSON.parse(legacyString) as unknown; // Should be LegacySaveData. Let's parse.
    if(!legacySave || typeof legacySave != 'object') {
        console.log('CYOL: Error retrieving legacy save format, using default settings...');
        setPreferences(newPrefs);
        return;
    }

    if(!('settings' in legacySave) || !(legacySave.settings) || (typeof legacySave.settings != 'object')) {
        console.log('CYOL: legacy save format is corrupted, using default settings...');
        setPreferences(newPrefs);
        return;
    }
    let settings = legacySave.settings;

    if('discrepancy' in settings) newPrefs.discrepancy = Number(settings.discrepancy);
    if('includeNormal' in settings)      newPrefs.filtering.includeType.normal =      Boolean(settings.includeNormal);
    if('includeBifurcated' in settings)  newPrefs.filtering.includeType.bifurcated =  Boolean(settings.includeBifurcated);
    if('includeGolden' in settings)      newPrefs.filtering.includeType.golden =      Boolean(settings.includeGolden);
    if('includeMeaty' in settings)       newPrefs.filtering.includeType.meaty =       Boolean(settings.includeMeaty);
    if('includeCaramelized' in settings) newPrefs.filtering.includeType.caramelized = Boolean(settings.includeCaramelized);
    if('preserveGrandmapocalypseStage' in settings) newPrefs.filtering.conditions.preserveGrandmapocalypseStage = settings.preserveGrandmapocalypseStage ? 'require' : 'observe';
    if('preserveDragon' in settings)                newPrefs.filtering.conditions.preserveDragon                = settings.preserveDragon                ? 'require' : 'observe';
    if('preservePantheon' in settings)              newPrefs.filtering.conditions.preservePantheon              = settings.preservePantheon              ? 'require' : 'observe';
    if('rowsToDisplay' in settings) newPrefs.display.rows = Number(settings.rowsToDisplay);

    setPreferences(newPrefs);
}

/* Retrieves data from CYOL versions 1.3.2 and earlier.
 *
 * Because CYOL's id changed between 1.3.2 and 1.4.0
 * (from "Choose your own lump" to "Choose Your Own Lump"),
 * we need to retrieve data from `Game.modSaveData['Choose your own lump']`.
 * Hence, besides being called on `CYOL.load(modSaveDataString)`,
 * this function also needs to be called on `CYOL.init()`
 * and on `CYOL.load()` (our injection, ran if `Game.modSaveData[name]` does not exist).
 * That these calls happen is ensured in main.ts.
 */
export function retrieveDataFromLegacySave() {
    let legacyId = "Choose your own lump";
    if(legacyId in Game.modSaveData) {
        loadSettingsFromLegacySave(Game.modSaveData[legacyId]);
        // @ts-ignore TODO: update @types/cookieclicker
        Game.deleteModData(legacyId);
    }
}

/* Read settings from the object,
 * which is expected to follow the type CYOLPreferences.
 * If version is provided,
 * nonexistent or mismatched settings are console.warn'd and the default is used.
 * Otherwise, the function throws an error.
 *
 * Rationale: the version is only undefined if the save was manufactured
 * (e.g. automated testing),
 * so problems should be signaled loudly as early as possible.
 */
export function getPreferencesFromObject(source: unknown, version?: string): CYOLPreferences {
    function onMistypedProperty(msg: string) {
        if(version === undefined) {
            throw new Error(msg);
        } else {
            console.warn(msg);
        }
    }

    // TODO actually add types to this
    function assign(target: any, source: any) {
        for(let key of Object.keys(target)) {
            if(key in source) {
                if(source[key] == null) {
                    onMistypedProperty(`${key} is null`);
                } else if(typeof target[key] != typeof source[key]) {
                    onMistypedProperty(`CYOL: Mistyped property: ${key}`);
                } else if(typeof target[key] == 'object') {
                    target[key] = assign(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    return assign(getDefaultPreferences(), source);
}

/* Resets any existing mod state to its default values.
 */
export function clearModState() {
    setPreferences(getDefaultPreferences());
}

/* Parses the save data from the string
 * (`console.warn`ing and throwing errors as needed)
 * and overwrites the current mod state with that data.
 *
 * This function calls clearModState on its own beforehand.
 */
export function loadSaveData(saveData: string) {
    clearModState();

    let saveDataAsObject = JSON.parse(saveData) as unknown;
    if(!saveDataAsObject || typeof saveDataAsObject != 'object') {
        console.warn('CYOL: Unknown save format, using defaults...');
        setPreferences(getDefaultPreferences());
        return;
    }

    let version: string | undefined = undefined;
    if('version' in saveDataAsObject) {
        if(typeof saveDataAsObject.version != 'string') {
            console.warn('CYOL: Unknown save format version, assuming most recent');
        } else {
            version = saveDataAsObject.version;
        }
    }

    if(!('preferences' in saveDataAsObject)) {
        console.warn('CYOL: missing preferences, using defaults...');
        setPreferences(getDefaultPreferences());
    } else if(!saveDataAsObject.preferences || typeof saveDataAsObject.preferences != 'object') {
        console.warn('CYOL: corrupted preferences, using defaults...');
        setPreferences(getDefaultPreferences());
    } else {
        let parsedPreferences = getPreferencesFromObject(saveDataAsObject.preferences, version);
        setPreferences(parsedPreferences);
    }
}

export function serializeSaveData(): string {
    let saveData: SaveData = {
        version,
        preferences,
    };
    return JSON.stringify(saveData);
}
