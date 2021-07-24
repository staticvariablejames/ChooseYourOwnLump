/* These functions turn the CYOL object compatible with the Mod interface,
 * used by Game.registerMod.
 */
import { settings, copySettings } from './UI/settings';
import { TransientState } from './transientState';
import { customLumpTooltip } from './UI/lumpTooltip';
import { customOptionsMenu } from './UI/optionsMenu';
import { rewriteCode } from './util';

export let name = "Choose Your Own Lump";
export let version = "1.2.7";
export let GameVersion = "2.031";
export let CCSEVersion = "2.023";
export let isLoaded: boolean = false;

export function save() {
    return JSON.stringify(settings);
}

export function load(str: string) {
    copySettings(JSON.parse(str));
}

export function init() {
    TransientState.init();

    // Legacy data, was previously stored in CCSE.config.OtherMods
    if(CCSE.config.OtherMods.CYOL) {
        copySettings(CCSE.config.OtherMods.CYOL);
        delete CCSE.config.OtherMods.CYOL; // be a good citizen and not bloat CCSE's save object
    }

    Game.customLumpTooltip!.push(customLumpTooltip);
    Game.customOptionsMenu!.push(customOptionsMenu);
    Game.customStatsMenu!.push(function() {
        CCSE.AppendStatsVersionNumber(name, version);
    });

    rewriteCode('Game.loadLumps', "Game.computeLumpTimes();", "$& CYOL.UI.sneakySaveDataRetrieval();");

    isLoaded = true;
    Game.Notify('Choose Your Own Lump loaded!', undefined, undefined, 1, true);
}
