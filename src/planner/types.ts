export type LumpType = 'normal' | 'bifurcated' | 'golden' | 'meaty' | 'caramelized';
export type PantheonSlot = 'diamond' | 'ruby' | 'jade' | 'none';
export type DragonAura = "none" | "Dragon's Curve" | "Reality Bending" | "Supreme Intellect";

/* Everything about the game state that is relevant for the planner.
 *
 * Note that, although technically a user preference,
 * the discrepancy is part of the PlannerRelevantState.
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

/* Information needed by the budget-conscious filter.
 */
export type BudgetInfo = {
    maxGrandmas: number,
    unlockedPantheon: boolean,
    unlockedDragonsCurve: boolean,
    unlockedRealityBending: boolean,
    unlockedSupremeIntellect: boolean,
    unlockedSecondAura: boolean,
};

type ConditionSetting = 'require' | 'observe' | 'ignore';

/* All user settings that are relevant for the planner.
 *
 * Note that, although technically a user preference,
 * the discrepancy is part of the PlannerRelevantState.
 */
export type PlannerPreferences = {
    threeColumnDragonAuras: boolean,
    conditions: {
        preserveDragon: ConditionSetting;
        preservePantheon: ConditionSetting;
        preserveGrandmapocalypseStage: ConditionSetting;
        respectBudget: ConditionSetting;
    },
    includeType: {
        [lump in LumpType]: boolean;
    },
};

// TODO: better name
export type FullGameState = {
    gameState: PlannerRelevantState,
    preferences: PlannerPreferences,
    budget: BudgetInfo,
};

export type DragonAuraReportEntry = {
    aura: DragonAura,
    style: 'normal' | 'faded',
    note: 'checkmark' | 'warn' | '',
};

export type PlannerReportEntry = {
    selectedEntry: boolean;
    lumpType: LumpType;
    autoharvestTimestamp: number;
    grandmaCount: number;
    grandmaCountNote: 'checkmark' | '';
    grandmapocalypseStages: [boolean, boolean, boolean, boolean];
    grandmapocalypseNote: 'checkmark' | '';
    // TODO: add information about changing stages, like mid-pledge, and recently-bought upgrades
    dragonAuras: DragonAuraReportEntry[],
    rigidelSlot: PantheonSlot;
    rigidelNote: 'checkmark' | '';
};

export type FilteredPlannerReport = {
    [lumpType in LumpType]?: PlannerReportEntry[];
};

// "Classic" planner report
export type FullListPlannerReport = PlannerReportEntry[];
