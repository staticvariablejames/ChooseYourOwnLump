export type LumpType = 'normal' | 'bifurcated' | 'golden' | 'meaty' | 'caramelized';
export type PantheonSlot = 'diamond' | 'ruby' | 'jade' | 'none';

/* Everything about the game state that is relevant for the planner.
 */
export type PlannerRelevantState = {
    discrepancy: number;

    // Parts of the game state that changes seldom
    hasSteviaCaelestis: boolean;
    hasSucralosiaInutilis: boolean;
    hasSugarAgingProcess: boolean;
    seed: string;

    /* Time that the current lump started coalescing; always an integer.
     *
     * In the context of lump plannering,
     * this value will always come from the save game.
     * During runtime the value of `Game.lumpT` may be fractional,
     * but when exporting save Cookie Clicker truncates the fractional part,
     * so the value of currentLumpT will always be an integer.
     */
    currentLumpT: number;

    // Parts of the game state that the player can change easily
    currentRigidelSlot: PantheonSlot;
    currentGrandmaCount: number;
    currentGrandmapocalypseStage: number; // Always 0, 1, 2, 3
    currentHasDragonsCurve: boolean;
    currentHasRealityBending: boolean;
    currentHasSupremeIntellect: boolean;
};

export type BudgetInfo = {
    maxGrandmas: number,
    unlockedPantheon: boolean,
    unlockedDragonsCurve: boolean,
    unlockedRealityBending: boolean,
    unlockedSupremeIntellect: boolean,
    unlockedSecondAura: boolean,
};
