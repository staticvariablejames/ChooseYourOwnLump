/* Helper file that declares the types of messages passed between the main thread and the worker.
 *
 * I do not know how to properly type web worker message passing,
 * so this file allows me to at least share types between worker.ts and planner.ts.
 */
import {
    LumpType,
    FullGameState,
    FilteredPlannerReport,
    FullListPlannerReport
} from './types';

export type PlannerComputationID = number;

export type MessageToTheWorker = {
    computationId: PlannerComputationID,
    fullGameState: FullGameState, // Currently we always inform everything
};

export type ResponseFromTheWorker = {
    computationId: PlannerComputationID,
    lumpType: LumpType, // Currently we always update the lump type
    filteredReport: FilteredPlannerReport, // Might be {}
    fullListReport: FullListPlannerReport, // Might be []
};
