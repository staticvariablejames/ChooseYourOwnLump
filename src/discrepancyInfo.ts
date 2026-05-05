/* Tools to calculate the discrepancy.
 *
 * Getting all the needed data to calculate the discrepancy is a bit tricky.
 *
 * The discrepancy is defined as the current value of Game.lumpT minus
 * the theoretical value that Game.lumpT would have if the discrepancy bug never happened.
 * This theoretical value can be calculated using the values of Game.lumpT and Game.lumpOverripeAge
 * at the moment that the game was saved.
 * So we need information from both the previous and the current game state.
 *
 * When loading a save game from localStorage,
 * CYOL is only `Game.LoadMod`ed after the previous values were already overriden,
 * so we cannot retrieve them from the save file;
 * hence, we store values of `Game.lumpT` and `Game.lumpOverripeAge` in CYOL's save data.
 *
 * Note that, when loading from the save file,
 * the previous value of Game.lumpT is actually available to us:
 * `Game.LoadSave` runs `Game.loadModData` (which runs `CYOL.load`) before running `Game.loadLumps`,
 * so in theory we could simply grab the previous value from `Game.lumpT`.
 * But `Game.lumpOverripeAge` is not available yet,
 * and we are already storing this value together with CYOL's save data,
 * so we use those values instead.
 *
 * - If the stored discrepancy info is not available
 *   (e.g. when updating from a previous version of CYOL)
 *   we do a best-effort approach and use the pre-`Game.loadLumps` value of `Game.lumpT`.
 *
 * The other piece of information needed to calculate the discrepancy
 * is the current value of `Game.lumpT`.
 * When loading from localStorage, we can simply grab that value as `Game.lumpT`,
 * but this is not the case when loading from a save file
 * precisely because `Game.loadLumps` hasn't updated `Game.lumpT` yet when `CYOL.load` runs.
 * We need to run some code after `Game.loadLumps` has updated `Game.lumpT`,
 * but there is no 'postload' hook.
 * The solution is to `setTimeout(retriever, 0)`,
 * where `retriever` will do the "dirty job" of retrieving the updated `Game.lumpT`.
 */

import type { CYOLPreferences } from './preferences';

export type DiscrepancyInfoRelevantData = {
    lumpT: number,
    lumpOverripeAge: number,
};
export type StoredDiscrepancyInfo = DiscrepancyInfoRelevantData;

/* LiveDiscrepancyInfo contains both the stored discrepancy information
 * and the current value gotten directly from Game.
 * All information about discrepancy can be calculated from objects of this type.
 *
 * The object discepancyInfo (which has this type) will only be written to
 * when loading a save game.
 * This ensures that discrepancy information displayed in UI/lumpTooltip.ts remains valid,
 * even if the player changes game state.
 */
export type LiveDiscrepancyInfo = {
    available: boolean,
    // If available == false, the values below are assumed to be invalid.
    previous: StoredDiscrepancyInfo,
    current: DiscrepancyInfoRelevantData,
    expectedDiscrepancy: number,
};

export const discrepancyInfo: LiveDiscrepancyInfo = {
    available: false,

    // Dummy/sentinel values
    previous: {
        lumpT: 1.6e12-2,
        lumpOverripeAge: 86400 * 1000 + 2,
    },
    current: {
        lumpT: 1.6e12-1,
        lumpOverripeAge: 86400 * 1000 + 1,
    },
    expectedDiscrepancy: 42,
};

export function clearDiscrepancyInfo() {
    discrepancyInfo.available = false;
}

// Returns just the bits of LiveDiscrepancyInfo that are stored in the save data
export function getDiscrepancyInfoForStorage() {
    let info: StoredDiscrepancyInfo = {
        lumpT: Math.floor(Game.lumpT), // Game.lumpT gets truncated before being stored to the save file
        lumpOverripeAge: Game.lumpOverripeAge,
    };
    return info;
}

/* Loads discrepancy info from the given object (which is a portion of a parsed save data).
 * newPrefs is the just-parsed preferences object.
 * This function must run during `CYOL.load`.
 */
export function loadDiscrepancyInfo(storedDiscrepancyInfo: object, newPrefs: CYOLPreferences, isInitialLoad: boolean) {
    discrepancyInfo.available = false;
    // TODO Type-check the following line
    discrepancyInfo.previous = storedDiscrepancyInfo as any;

    discrepancyInfo.expectedDiscrepancy = newPrefs.discrepancy;

    function retriever() {
        discrepancyInfo.current.lumpT = Game.lumpT;
        discrepancyInfo.current.lumpOverripeAge = Game.lumpOverripeAge;
        discrepancyInfo.available = true;
    }
    if(isInitialLoad) {
        // `Game.loadLumps` has already updated `Game.lumpT` (see the documentation in the beginnnig of the file)
        retriever();
    } else {
        // `Game.loadLumps` will run later, but still in the same job. So we wait a little bit
        setTimeout(retriever, 0);
    }
}

/* Best-effort function which assembles a usable discrepancyInfo object
 * if there is no stored discrepancy information.
 * This function must run during `CYOL.load`.
 */
export function discrepancyInfoRetrievalFallback(newPrefs: CYOLPreferences, isInitialLoad: boolean) {
    discrepancyInfo.expectedDiscrepancy = newPrefs.discrepancy;
    if(isInitialLoad) {
        // Can't do anything in this case
        discrepancyInfo.available = false;
    } else {
        discrepancyInfo.available = false;
        discrepancyInfo.previous.lumpT = Game.lumpT; // Game.loadLumps hasn't run yet
        setTimeout(() => {
            discrepancyInfo.current.lumpT = Game.lumpT;
            discrepancyInfo.current.lumpOverripeAge = Game.lumpOverripeAge;
            // We hope the following line is correct
            discrepancyInfo.previous.lumpOverripeAge = Game.lumpOverripeAge;
            discrepancyInfo.available = true;
        }, 0);
    }
}
