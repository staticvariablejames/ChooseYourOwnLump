/* In CYOL.init(),
 * a call to sneakySaveDataRetrieval is injected right before the new lump type is calculated.
 * This allows us to display the actual value of discrepancy to the user.
 */
export let previousAutoharvestTime: number | null = null;
export let previousLumpT: number | null = null;
/* It seems that, in rare cases,
 * the game might try to loadLumps before all minigames have finished loading.
 * This means that the bonus from Rigidel cannot be computed
 * and is simply skipped.
 * So we warn the player about this issue in the lump tooltip.
 */
export let warnPantheonNotLoaded: boolean = false;
export function sneakySaveDataRetrieval() {
    previousLumpT = Game.lumpT;
    previousAutoharvestTime = Game.lumpT + Game.lumpOverripeAge;
    warnPantheonNotLoaded = !Game.hasGod;
}
