export type LumpType = 'normal' | 'bifurcated' | 'golden' | 'meaty' | 'caramelized';
export type PantheonSlot = 'diamond' | 'ruby' | 'jade' | 'none';

/* Everything about the game state that is relevant for the planner.
 */
export type PlannerRelevantState = {
    discrepancy: number;
    hasSteviaCaelestis: boolean;
    hasSucralosiaInutilis: boolean;
    hasSugarAgingProcess: boolean;

    currentLumpT: number; // Time the current lump started coalescing; always an integer
    currentSeed: string;

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
