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
import { planner } from './planner/planner';
import { preferences } from './preferences';
import {
    loadSaveData,
    serializeSaveData,
    retrieveDataFromLegacySave,
    clearModState,
} from './saveDataManagement';
import { registerLumpIconWheelEventListener } from './UI/lumpIconScrolling';
import { customLumpTooltip } from './UI/lumpTooltip';
import { customOptionsMenu, onSliderUpdate, onButtonClick } from './UI/optionsMenu';
import { rewriteCode } from './util';
import { sneakySaveDataRetrieval } from './UI/preAutoharvestDataRetrieval';

let CYOL = {
    // Basic information about the mod
    name: name,
    version: version,
    isLoaded: false,

    // Global variables, not really part of the public API but useful for testing
    preferences, // See preferences.ts
    planner,

    /* UI callbacks.
     * These need to be here for the buttons in the options menu to work,
     * but are not part of the public API.
     */
    UI: {
        sneakySaveDataRetrieval,
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
        Game.customLumpTooltip.push(customLumpTooltip);
        Game.customOptionsMenu.push(customOptionsMenu);
        Game.customStatsMenu.push(function() {
            CCSE.AppendStatsVersionNumber(name, version);
        });

        rewriteCode(
            'Game.loadLumps',
            "Game.computeLumpTimes();",
            "$& CYOL.UI.sneakySaveDataRetrieval();"
        );
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

        Game.modHooks['reset'].push((hard?: boolean) => {
            if(hard) {
                clearModState();
            }
        });

        retrieveDataFromLegacySave();
        registerLumpIconWheelEventListener();

        CYOL.isLoaded = true;
        Game.Notify('Choose Your Own Lump loaded!', '', undefined, 1, true);
    },

    save: function() {
        return serializeSaveData();
    },

    /* Cookie Clicker always calls this method passing a string,
     * the "undefined" is injected by us,
     * to run this function even if `Game.modSaveData[name]` does not exist.
     */
    load: function(str?: string) {
        if(str === undefined) {
            clearModState();
            retrieveDataFromLegacySave();
        } else {
            loadSaveData(str);
        }
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
