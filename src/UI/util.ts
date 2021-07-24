export function currentLumpType() {
    switch(Game.lumpCurrentType) {
        case 0: return 'normal';
        case 1: return 'bifurcated';
        case 2: return 'golden';
        case 3: return 'meaty';
        case 4: return 'caramelized';
        default: return 'unknown';
    }
}

/* Returns a number representing the Pantheon slot that is current occupied by Rigidel.
 * The number is 3 if Diamond, 2 if Ruby, 1 if Jade, and 0 if unslotted
 * (or if the Pantheon is not loaded).
 *
 * Note that the slot order is different from the order in the game;
 * this simplifies calculations.
 *
 * Note also that if the number of buildings is not a multiple of ten,
 * Rigidel will be inactive regardless of the value of currentRigidelSlot.
 */
export function currentRigidelSlot() {
    if(Game.hasGod && Game.hasGod('order')) {
        return 4 - Number(Game.hasGod('order'));
    } else {
        return 0;
    }
}
