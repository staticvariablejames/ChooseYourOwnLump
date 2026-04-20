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
export type RequestType = 'lumpType' | 'filteredReport' | 'fullListReport';

export type MessageToTheWorker = {
    request: RequestType;
    computationId: PlannerComputationID,
    fullGameState: FullGameState, // Currently we always inform everything
};

type ResponseBase = {
    request: RequestType;
    computationId: PlannerComputationID;
    lumpType: LumpType; // Currently we always provide the lump type on any request
};

type LumpTypeResponse = ResponseBase & {
    request: 'lumpType';
}

type FilteredReportResponse = ResponseBase & {
    request: 'filteredReport';
    report: FilteredPlannerReport;
}

type FullListReportResponse = ResponseBase & {
    request: 'fullListReport';
    report: FullListPlannerReport;
}

export type ResponseFromTheWorker =
    LumpTypeResponse |
    FilteredReportResponse |
    FullListReportResponse;
