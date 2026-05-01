/* This file defines the object CYOL and "registers" it.
 *
 * This object is registered in three different places:
 *  1. `window.CYOL = CYOL` makes it accessible everywhere.
 *  2. The `interface Window` is extended, allowing typechecking of `window.CYOL.*` calls.
 *  3. `Game.registerMod(id, CYOL)`
 *
 * As such, the object CYOL essentially contains the public interface of the mod,
 * plus a few extra things:
 *  - Some internal methods are exposed to enable automated testing.
 *  - UI callbacks.
 *      Many UI functions in Cookie Clicker (like building the options menu)
 *      require us to return HTML fragments, and the Javascript code inside attributes like onclick
 *      may only reference globally available methods.
 *      So we store them here.
 *  - Methods init(), save(), load(): These are called by Cookie Clicker,
 *      as we use that same object to Game.registerMod(id, CYOL).
 *
 * These functions turn the CYOL object compatible with the Mod interface,
 * used by Game.registerMod.
 */
import { name, version, GameVersion } from './modInfo';
import { discrepancyInfo, discrepancyInfoRetrievalFallback } from './discrepancyInfo';
import { planner } from './planner/planner';
import { preferences } from './preferences';
import {
    loadSaveData,
    serializeSaveData,
    retrieveDataFromLegacySave,
    clearModState,
    clearModData,
} from './saveDataManagement';
import { registerLumpIconWheelEventListener } from './UI/lumpIconScrolling';
import { customLumpTooltip } from './UI/lumpTooltip';
import { customOptionsMenu, onSliderUpdate, onButtonClick } from './UI/optionsMenu';
import { rewriteCode } from './util';

let CYOL = {
    // Basic information about the mod
    name: name,
    version: version,
    isLoaded: false,

    /* Internal data;
     * true if CYOL.load is being run together with init, false if "alone" after a Game.LoadSave.
     * This bit of data is required by the tools in discrepancyInfo.ts
     * (and informed to them through loadSaveData below).
     *
     * The value below is actually a dummy value.
     * CYOL.init() is called by Game.registerMod, which then calls CYOL.load() immediately afterwards
     * but only if Game.modSaveData[name] exists.
     * This is the only time that CYOL.load is executed outside of Game.loadModData.
     * So we set CYOL.isInitialLoad to false if Game.modSaveData[name] does not exist,
     * because in this case every call to CYOL.load happens inside Game.loadModData.
     * CYOL.load then sets this to false so we know future calls to CYOL.load() are not initial.
     */
    isInitialLoad: true,

    // Global variables, not really part of the public API but useful for testing
    preferences, // See preferences.ts
    planner,
    discrepancyInfo,

    /* UI callbacks.
     * These need to be here for the buttons in the options menu to work,
     * but are not part of the public API.
     */
    UI: {
        onSliderUpdate,
        onButtonClick,
    },

    /* This function is not part of Cookie Clicker's modding API,
     * we inject a call to this in the beginning of Game.LoadMod ourselves.
     */
    preload: function() {
        /* Vanilla bug:
         * Cookie Clicker does not erase `Game.modSaveData` when `Game.LoadSave` is run.
         * This means that,
         * if the previous save had data in `Game.modSaveData["Choose Your Own Lump"]`
         * and the new save has not,
         * the mod save data from the previous save leaks onto the new save.
         *
         * So we delete `Game.modSaveData[name]` before the next save is loaded.
         */
        delete Game.modSaveData[name];
    },

    // The following attributes are used by Game.registerMod
    id: name, // Overwritten by Game.registerMod anyway, but here for documentation
    init: function() {
        // Vanilla hooks
        Game.modHooks['reset'].push((hard?: boolean) => {
            if(hard) {
                clearModState();
            }
        });

        // CCSE hooks
        Game.customLumpTooltip.push(customLumpTooltip);
        Game.customOptionsMenu.push(customOptionsMenu);
        Game.customStatsMenu.push(function() {
            CCSE.AppendStatsVersionNumber(name, version);
        });

        // Other hooks
        registerLumpIconWheelEventListener();

        // Code injections
        rewriteCode(
            'Game.LoadSave',
            '{', // Opening brace
            '{\nCYOL.preload(); // Injected by Choose Your Own Lump\n'
        );
        rewriteCode(
            'Game.loadModData',
            '{', // Opening brace
            `{\nif(!("${name}" in Game.modSaveData)) CYOL.load(); // Injected by Choose Your Own Lump\n`
        );

        // Save Data loading
        clearModData();
        retrieveDataFromLegacySave();

        CYOL.isInitialLoad = name in Game.modSaveData; // See isInitialLoad's documentation above

        CYOL.isLoaded = true;
        Game.Notify('Choose Your Own Lump loaded!', '', undefined, 1, true);
    },

    save: function() {
        return serializeSaveData();
    },

    /* Cookie Clicker always calls this method passing a string.
     * We also inject code to `Game.loadModData` to call `CYOL.load()` (without arguments)
     * if `Game.modSaveData[name]` does not exist.
     */
    load: function(str?: string) {
        if(str === undefined) {
            clearModData();
            retrieveDataFromLegacySave();
            discrepancyInfoRetrievalFallback(CYOL.preferences, CYOL.isInitialLoad);
        } else {
            loadSaveData(str, CYOL.isInitialLoad);
        }
        CYOL.isInitialLoad = false;
    },
};

declare global {
    interface Window {
        CYOL: typeof CYOL;
    }
}

window.CYOL = CYOL;

if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

if(!CYOL.isLoaded){
    if(window.CCSE && window.CCSE.isLoaded){
        Game.registerMod(CYOL.id, CYOL);
    }
    else {
        if(!window.CCSE) window.CCSE = ({} as (typeof CCSE));
        if(!window.CCSE.postLoadHooks) window.CCSE.postLoadHooks = [];
        window.CCSE.postLoadHooks.push(function() {
            if(window.CCSE.ConfirmGameVersion(name, version, GameVersion)) {
                Game.registerMod(CYOL.id, CYOL);
            }
        });
    }
}
