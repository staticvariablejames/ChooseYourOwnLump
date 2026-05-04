/* Utilities to grab the current state of the game.
 */
import { PlannerRelevantState, BudgetInfo, FilteringPreferences, PantheonSlot } from './types';
import { preferences } from '../preferences';

/* Returns a copy of the current filtering preferences.
 * Being a copy means that the returned object won't change
 * even if the actual preferences do.
 */
export function getCurrentFilteringPreferences(): FilteringPreferences {
    return structuredClone(preferences.filtering);
};

export function getCurrentGameState(): PlannerRelevantState {
    let currentRigidelSlot: PantheonSlot = 'none';
    let slots = Game?.Objects['Temple']?.minigame?.slot ?? null;
    if(slots) {
        // Cannot use Game.hasGod because that function takes Supreme Intellect into account
        let rigidelId = Game.Objects['Temple'].minigame.gods['order'].id;
        if(slots[0] == rigidelId) currentRigidelSlot = 'diamond';
        if(slots[1] == rigidelId) currentRigidelSlot = 'ruby';
        if(slots[2] == rigidelId) currentRigidelSlot = 'jade';
    }
    if(Game.BuildingsOwned % 10 != 0) {
        // TODO: remove this if isRigidelActive gets added to currentGameState
        currentRigidelSlot = 'none';
    }

    return {
        discrepancy: preferences.discrepancy,
        hasSteviaCaelestis: Boolean(Game.Has('Stevia Caelestis')),
        hasSucralosiaInutilis: Boolean(Game.Has('Sucralosia Inutilis')),
        hasSugarAgingProcess: Boolean(Game.Has('Sugar aging process')),
        seed: Game.seed,
        /* Game.lumpT gets Math.floor'd before being stored,
         * and it is this truncated value that is used for lump times computation.
         */
        currentLumpT: Math.floor(Game.lumpT),
        currentRigidelSlot,
        currentGrandmaCount: Game.Objects['Grandma'].amount,
        currentGrandmapocalypseStage: Game.elderWrath,
        currentHasDragonsCurve: Game.hasAura("Dragon's Curve"),
        currentHasRealityBending: Game.hasAura("Reality Bending"),
        currentHasSupremeIntellect: Game.hasAura("Supreme Intellect"),
    };
}

const bankFactor = 0.01; // We'll use at most 1% of the bank to purchase things

export function getCurrentBudget(): BudgetInfo {
    function maximumPurchases(building: Game.Object, cap: number) {
        let budget = Game.cookies * bankFactor;
        for(let count = building.amount; count <= cap; count++) {
            if(building.getSumPrice(count - building.amount) > budget) {
                return count-1;
            }
        }
        return cap;
        /* TODO: Performance.
         * This function is actually O(n^2) because getSumPrice also uses a loop,
         * rather than the geometric series formula.
         * Furthermore we might want to make this function _not_ sensitive
         * to dynamic fluctuations of building price buffs (e.g. the "Everything must go" effect).
         */
    }
    // TODO also check if e.g. Reality Bending is already unlocked
    return {
        maxGrandmas: maximumPurchases(Game.Objects['Grandma'], 600),
        unlockedPantheon: Game.Objects['Temple'].level > 0,
        unlockedDragonsCurve: maximumPurchases(Game.Objects['Fractal engine'], 100) >= 100,
        unlockedRealityBending: maximumPurchases(Game.Objects['Javascript console'], 100) >= 100,
        unlockedSupremeIntellect: maximumPurchases(Game.Objects['Idleverse'], 100) >= 100,
        unlockedSecondAura: maximumPurchases(Game.Objects['You'], 200) >= 200,
    };
};

export function getCurrentFullGameState() {
    return {
        gameState: getCurrentGameState(),
        preferences: getCurrentFilteringPreferences(),
        budget: getCurrentBudget()
    };
}
