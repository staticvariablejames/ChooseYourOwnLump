/* Utilities to grab the current state of the game.
 */
import { PlannerRelevantState, BudgetInfo, FilteringPreferences } from './types';

export function getCurrentFilteringPreferences(): FilteringPreferences {
    // FIXME: actually get it from the settings
    return {
        threeColumnDragonAuras: false,
        conditions: {
            preserveDragon: 'observe',
            preservePantheon: 'observe',
            preserveGrandmapocalypseStage: 'observe',
            respectBudget: 'observe',
        },
        includeType: {
            normal: false,
            bifurcated: false,
            golden: true,
            meaty: false,
            caramelized: true,
        },
    };
};

export function getCurrentGameState(): PlannerRelevantState {
    // FIXME: actually get it from the game state
    return {
        discrepancy: 0,
        hasSteviaCaelestis: false,
        hasSucralosiaInutilis: false,
        hasSugarAgingProcess: false,
        seed: 'aaaaa',
        currentLumpT: 1.6e12,
        currentRigidelSlot: 'none',
        currentGrandmaCount: 0,
        currentGrandmapocalypseStage: 0,
        currentHasDragonsCurve: false,
        currentHasRealityBending: false,
        currentHasSupremeIntellect: false,
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
