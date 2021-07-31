/* These functions turn the CYOL object compatible with the Mod interface,
 * used by Game.registerMod.
 */
import { loadSettingsFrom, exportSettings } from './UI/settings';
import { customLumpTooltip } from './UI/lumpTooltip';
import { customOptionsMenu } from './UI/optionsMenu';
import { rewriteCode } from './util';

export let name = "Choose Your Own Lump";
export let version = "1.3.0";
export let GameVersion = "2.031";
export let CCSEVersion = "2.023";
export let isLoaded: boolean = false;

export function save() {
    return exportSettings();
}

export function load(str: string) {
    loadSettingsFrom(str);
}

export function init() {
    // Legacy data, was previously stored in CCSE.config.OtherMods
    if(CCSE.config.OtherMods.CYOL) {
        loadSettingsFrom(JSON.stringify(CCSE.config.OtherMods.CYOL));
        // Using JSON.stringify is easier than writing a separate function just for legacy support
        delete CCSE.config.OtherMods.CYOL; // be a good citizen and not bloat CCSE's save object
    }

    Game.customLumpTooltip.push(customLumpTooltip);
    Game.customOptionsMenu.push(customOptionsMenu);
    Game.customStatsMenu.push(function() {
        CCSE.AppendStatsVersionNumber(name, version);
    });

    rewriteCode('Game.loadLumps', "Game.computeLumpTimes();", "$& CYOL.UI.sneakySaveDataRetrieval();");

    isLoaded = true;
    Game.Notify('Choose Your Own Lump loaded!', '', undefined, 1, true);
}
