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
import { PersistentState } from './persistentState';
import { TransientState } from './transientState';
import { DragonAuras } from './dragonAuras';
import { loadSettingsFrom, exportSettings } from './UI/settings';
import { customLumpTooltip } from './UI/lumpTooltip';
import { customOptionsMenu } from './UI/optionsMenu';
import { rewriteCode } from './util';
import * as UI from './UI/index';

let CYOL = {
    // Basic information about the mod
    name: name,
    version: version,
    isLoaded: false,

    // Global variables, not really part of the public API but useful for testing
    preferences,
    planner,

    // Mainly used for testing
    PersistentState: PersistentState,
    TransientState: TransientState,
    DragonAuras: DragonAuras,

    // UI; needs to be here for the UI callbacks to work, but not quite part of the public API
    UI: UI,

    // Used by Game.registerMod
    init: function() {
        Game.customLumpTooltip.push(customLumpTooltip);
        Game.customOptionsMenu.push(customOptionsMenu);
        Game.customStatsMenu.push(function() {
            CCSE.AppendStatsVersionNumber(name, version);
        });

        rewriteCode('Game.loadLumps', "Game.computeLumpTimes();", "$& CYOL.UI.sneakySaveDataRetrieval();");

        CYOL.isLoaded = true;
        Game.Notify('Choose Your Own Lump loaded!', '', undefined, 1, true);
    },

    save: function() {
        return exportSettings();
    },

    load: function(str: string) {
        loadSettingsFrom(str);
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
    let id = 'Choose your own lump'; // TODO: change this to CYOL.name
    if(window.CCSE && window.CCSE.isLoaded){
        Game.registerMod(id, CYOL);
    }
    else {
        if(!window.CCSE) window.CCSE = ({} as (typeof CCSE));
        if(!window.CCSE.postLoadHooks) window.CCSE.postLoadHooks = [];
        window.CCSE.postLoadHooks.push(function() {
            if(window.CCSE.ConfirmGameVersion(name, version, GameVersion)) {
                Game.registerMod(id, CYOL);
            }
        });
    }
}
