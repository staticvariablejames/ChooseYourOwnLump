/* Web worker which houses the planner computations.
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *      Communication protocol
 *
 * TODO: update this description
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
    let { request, computationId, fullGameState } = ev.data;

    let plannerCore = new PlannerCore(fullGameState.gameState);
    let processor: CachedConfigurationsProcessor = (() => {
        for(let processor of cache) {
            if(processor.updateCoreIfCompatible(plannerCore)) {
                return processor;
            }
        }
        let processor = new CachedConfigurationsProcessor(plannerCore);
        // unshift instead of push because I expect new entries to be used more often
        cache.unshift(processor);
        return processor;
    })();

    let lumpType = plannerCore.currentPrediction();

    let response: ResponseFromTheWorker;
    switch(request) {
        case 'lumpType':
            response = { request, computationId, lumpType };
            break;
        case 'filteredReport':
            response = { request, computationId, lumpType,
                report: processor.getFilteredPlannerReport(fullGameState),
            };
            break;
        case 'fullListReport':
            response = { request, computationId, lumpType,
                report: processor.getFullListPlannerReport(fullGameState),
            };
    }
    self.postMessage(response);
};
