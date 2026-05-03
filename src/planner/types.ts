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

export type ConditionSetting = 'require' | 'observe' | 'ignore';

/* All user settings that are relevant for the planner.
 *
 * Note that, although technically a user preference,
 * the discrepancy is part of the PlannerRelevantState.
 */
export type FilteringPreferences = {
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
    preferences: FilteringPreferences,
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
    grandmaCount: number | null; // null only if without "Sugar aging process"
    grandmaCountNote: 'checkmark' | 'warn' | ''; // 'warn' only if "Sugar aging process" not bought
    grandmapocalypseStages: [boolean, boolean, boolean, boolean];
    grandmapocalypseNote: 'checkmark' | '';
    // TODO: add information about changing stages, like mid-pledge, and recently-bought bingo center upgrades
    dragonAuras: DragonAuraReportEntry[],
    rigidelSlot: PantheonSlot;
    rigidelNote: 'checkmark' | '';
};

/* Report returned by CachedConfigurationsProcessor.prototype.getSummaryPlannerReport.
 * For each included lump type, contains a list of "the best" configurations.
 *
 * "The best" configurations all satisfy the 'required' FilteringPreferences.conditions,
 * and each of them satisfy at least one of the 'observed' FilteringPreferences.conditions.
 * Furthermore,
 * among the configurations satisfying these conditions,
 * "the best" are the ones who happen earliest.
 *
 * The included lump types are chosen by the given FilteringPreferences.includeType.
 */
export type SummaryPlannerReport = {
    [lumpType in LumpType]?: PlannerReportEntry[];
};

/* Report returned by CachedConfigurationsProcessor.prototype.getFullListPlannerReport.
 * It lists all configurations yielding lump types in FilteringPreferences.includeType,
 * and only configurations satisfying 'required' FilteringPreferences.conditions.
 *
 * The report is a list of sublists.
 * Configurations in each sublist are all equivalent.
 * Normally each sublist contains a single representative of its "equivalence class",
 * and the representatives satisfying 'observed' FilteringPreferences.conditions are prioritized.
 * If there are multiple representatives satisfying 'observed' FilteringPreferences.conditions,
 * they are all included in the sublist
 * (which is the only case where a sublist may be longer than a single element).
 * The sublists are sorted by autoharvestTimestamp in ascending order.
 */
export type FullListPlannerReport = PlannerReportEntry[][];
