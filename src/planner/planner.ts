/* Class that represents CYOL's lump planner.
 *
 * On construction,
 * this class instantiates a web worker which handles all planner-related computation.
 * Results from the web worker are cached,
 * and are served using a stale-while-revalidate caching strategy.
 *
 * For example, if the currently cached lump type is valid (does not need an update),
 * the method CoalescingLumpsPlanner.prototype.getAndUpdateLumpTypePrediction() returns
 * `{lumpType: cachedLumpType, isCurrent: true}`.
 * If the lump type needs an update, it returns `{lumpType: cachedLumpType, isCurrent: false}`,
 * but before that it issues a request to the web worker to recalculate the current lump type.
 * We emphasize that the returned `lumpType` may very well be wrong if isCurrent == false,
 * but by behaving like so,
 * we may present the players _some_ data whilst the current value is being recalculated,
 * which I believe makes for a better user experience.
 */

import { FullGameState, LumpType, FilteredPlannerReport, FullListPlannerReport } from './types';
import { getCurrentFullGameState } from './util';
import { MessageToTheWorker, PlannerComputationID, ResponseFromTheWorker } from './workerMessages';

import PlannerWorker from './worker?worker&inline';

export class CoalescingLumpsPlanner {
    public worker: Worker;

    // The communication protocol is outlined in worker.ts
    public lastRequestComputationId: PlannerComputationID = 0;
    public lastRequestGameState: FullGameState;
    public ongoingComputation: boolean = false;
    public cachedLumpTypePrediction: LumpType = 'normal';
    public cachedFilteredReport: FilteredPlannerReport = {};
    public cachedFullListReport: FullListPlannerReport = [];

    constructor() {
        this.worker = new PlannerWorker();
        this.worker.onmessage = (ev: MessageEvent<ResponseFromTheWorker>) => {
            let response = ev.data;
            if(response.computationId == this.lastRequestComputationId) {
                // Response corresponds to the last computation
                this.ongoingComputation = false;
            }
            /* Always update the cache.
             * This does means that players may see their tooltips update with old computation,
             * until the worker updates us with the latest computation results.
             */
            this.cachedLumpTypePrediction = response.lumpType;
            this.cachedFilteredReport = response.filteredReport;
            this.cachedFullListReport = response.fullListReport;
        };

        this.lastRequestGameState = getCurrentFullGameState();
        this.updateCache(this.lastRequestGameState);
    }

    /* Immediately returns the currently cached lump type and whether it is valid or not.
     * Furthermore,
     * if the cached lump type is not valid,
     * also issues a recalculation request (that will later complete asynchronously).
     */
    public getAndUpdateLumpTypePrediction() {
        let isCurrent = this.getStateAndUpdateCache();
        return { lumpTypePrediction: this.cachedLumpTypePrediction, isCurrent };
    }

    /* Immediately returns the currently cached filtered report and whether it is valid or not.
     * Furthermore,
     * if the cached lump type is not valid,
     * also issues a recalculation request (that will later complete asynchronously).
     * TODO: if preferences.reportType == 'fullList', this always returns {}
     */
    public getAndUpdateFilteredReport() {
        let isCurrent = this.getStateAndUpdateCache();
        return { filteredReport: this.cachedFilteredReport, isCurrent };
    }

    /* Immediately returns the currently cached full list report and whether it is valid or not.
     * Furthermore,
     * if the cached lump type is not valid,
     * also issues a recalculation request (that will later complete asynchronously).
     * TODO: if preferences.reportType == 'filtered', this always returns []
     */
    public getAndUpdateFullListReport() {
        let isCurrent = this.getStateAndUpdateCache();
        return { filteredReport: this.cachedFullListReport, isCurrent };
    }

    /* Updates the cache, using the current value of this.cacheGameState.
     */
    public updateCache(newGameState: FullGameState) {
        this.lastRequestComputationId++;
        this.lastRequestGameState = newGameState;
        let message: MessageToTheWorker = {
            computationId: this.lastRequestComputationId,
            fullGameState: this.lastRequestGameState,
        };
        this.ongoingComputation = true;
        this.worker.postMessage(message);
    }

    /* If the cache is current, returns true.
     * Otherwise, issue a recalculation request and returns false.
     */
    public getStateAndUpdateCache() {
        let currentGameState = getCurrentFullGameState();
        // TODO better comparison
        if(JSON.stringify(currentGameState) != JSON.stringify(this.lastRequestGameState)) {
            // Latest request does not match the current game state, need to issue a new request
            this.updateCache(currentGameState);
            return false;
        } else {
            /* The latest request matches the current game state, no need to issue a new request.
             * Furthermore,
             * - If there is ongoing computation, the cached value is clearly stale.
             * - If there is no ongoing computation, then the cached value matches the current state.
             */
            return !this.ongoingComputation;
        }
    }
}
