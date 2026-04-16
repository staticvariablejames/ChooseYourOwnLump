/* Web worker which houses the planner computations.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *      Communication protocol
 *
 * Whenever the game state changes in a way relevant to the planner
 * (e.g. changing the seed, or a setting),
 * the CoalescingLumpsPlanner owning this worker posts a message passing the new game state.
 * This message also contains a computation ID, which is unique to each message.
 * The worker processes the state change and returns the computation results,
 * together with the computation ID.
 *
 * Computation requests cannot be interrupted once started,
 * so having the computation ID being returned together with the computation result
 * allows results from "old" computation requests to be ignored.
 *
 * In a sense, this is an ad-hoc RPC protocol.
 */

import { PlannerCore } from './core';
import { FilteredPlannerReport, FullListPlannerReport } from './types';
import { CachedConfigurationsProcessor } from './processing';
import { MessageToTheWorker, ResponseFromTheWorker } from './workerMessages';

/* List of CachedConfigurationsProcessor.
 * Whenever we get a message, we search this list for one matching the cache.
 * If not found, we add a new one to the cache.
 *
 * The idea is that if the player messes with the discrepancy setting,
 * we can quickly find again the cached data.
 */
let cache: CachedConfigurationsProcessor[] = [];

self.onmessage = (ev: MessageEvent<MessageToTheWorker>) => {
    let { computationId, fullGameState } = ev.data;

    let plannerCore = new PlannerCore(fullGameState.gameState);
    let filteredReport: FilteredPlannerReport = {};
    let fullListReport: FullListPlannerReport = [];

    let processor: CachedConfigurationsProcessor = (() => {
        for(let processor of cache) {
            if(processor.updateCoreIfCompatible(plannerCore)) {
                return processor;
            }
        }
        let processor = new CachedConfigurationsProcessor(plannerCore);
        cache.push(processor);
        return processor;
    })();

    // TODO: perhaps here is not the best place to do this branch
    switch(fullGameState.preferences.reportType) {
        case 'filtered':
            filteredReport = processor.getFilteredPlannerReport(fullGameState);
            break;
        case 'fullList':
            fullListReport = processor.getFullListPlannerReport(fullGameState);
            break;
    }

    let response: ResponseFromTheWorker = {
        computationId,
        lumpType: plannerCore.currentPrediction(),
        filteredReport,
        fullListReport,
    };
    self.postMessage(response);
};
