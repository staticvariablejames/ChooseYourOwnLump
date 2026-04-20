/* CYOL's lump planner.
 *
 * The main export of this file is the global object `planner`,
 * which is of the class `CoalesingLumpsPlanner` (also exported by this file).
 * On construction,
 * this class instantiates a web worker which handles all planner-related computation.
 * Results from the web worker are cached,
 * and are served using a stale-while-revalidate caching strategy.
 *
 * (In theory, users of this class could have their own instances of CoalescingLumpsPlanner,
 * but these instances would not share the cache.)
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
import { MessageToTheWorker, PlannerComputationID, ResponseFromTheWorker, RequestType } from './workerMessages';

import PlannerWorker from './worker?worker&inline';

type CachedItem<T> = {
    value: T;

    // Whether the worker was issued a request to update this value but hasn't answered yet
    ongoingComputation: boolean;

    // Comuptation ID and gameState of the last request issued to update this item
    computationId: PlannerComputationID;
    gameState: FullGameState | null;
};

export class CoalescingLumpsPlanner {
    public worker: Worker;

    // The communication protocol is outlined in worker.ts
    public currentComputationId = 0;
    public lumpTypePrediction: CachedItem<LumpType> = {
        value: 'normal',
        computationId: 0,
        gameState: null,
        ongoingComputation: false,
    };
    public filteredReport: CachedItem<FilteredPlannerReport> = {
        value: {},
        computationId: 0,
        gameState: null,
        ongoingComputation: false,
    };
    public fullListReport: CachedItem<FullListPlannerReport> = {
        value: [],
        computationId: 0,
        gameState: null,
        ongoingComputation: false,
    };

    constructor() {
        this.worker = new PlannerWorker();
        this.worker.onmessage = (ev: MessageEvent<ResponseFromTheWorker>) => {
            this.processWorkerResponse(ev.data);
        };
    }

    /* Processes the incoming worker message.
     */
    public processWorkerResponse(response: ResponseFromTheWorker) {
        let lumpTypePrediction = this.lumpTypePrediction;
        let updateLumpType = () => {
            if(response.computationId == lumpTypePrediction.computationId) {
                lumpTypePrediction.ongoingComputation = false;
            }
            /* Always update the cache.
             * This does means that players may see their tooltips update with old computation,
             * until the worker updates us with the latest computation results.
             *
             * We still know the old computation is old because ongoingComputation is still true,
             * so we still return isCurrent === false,
             * whence readers of this information are still well-informed about the status.
             */
            lumpTypePrediction.value = response.lumpType;
        };
        switch(response.request) {
            case 'lumpType':
                updateLumpType();
                break;
            case 'filteredReport':
                if(this.filteredReport.computationId == response.computationId) {
                    this.filteredReport.ongoingComputation = false;
                }
                this.filteredReport.value = response.report;
                updateLumpType();
                break;
            case 'fullListReport':
                if(this.fullListReport.computationId == response.computationId) {
                    this.fullListReport.ongoingComputation = false;
                }
                this.fullListReport.value = response.report;
                updateLumpType();
                break;
        }
    }

    /* Immediately returns the currently cached lump type and whether it is valid or not.
     * Furthermore,
     * if the cached lump type is not valid,
     * also issues a recalculation request (that will later complete asynchronously).
     */
    public getAndUpdateLumpTypePrediction() {
        let isCurrent = this.getStatusAndUpdateCache('lumpType', [this.lumpTypePrediction]);
        return { prediction: this.lumpTypePrediction.value, isCurrent };
    }

    /* Immediately returns the currently cached filtered report and whether it is valid or not.
     * Furthermore,
     * if the cached lump type is not valid,
     * also issues a recalculation request (that will later complete asynchronously).
     */
    public getAndUpdateFilteredReport() {
        let isCurrent = this.getStatusAndUpdateCache('filteredReport',
                                                     [this.lumpTypePrediction, this.filteredReport]);
        return { report: this.filteredReport.value, isCurrent };
    }

    /* Immediately returns the currently cached full list report and whether it is valid or not.
     * Furthermore,
     * if the cached lump type is not valid,
     * also issues a recalculation request (that will later complete asynchronously).
     */
    public getAndUpdateFullListReport() {
        let isCurrent = this.getStatusAndUpdateCache('fullListReport',
                                                     [this.lumpTypePrediction, this.fullListReport]);
        return { report: this.fullListReport.value, isCurrent };
    }

    /* If the cached items are outdated,
     * issues a request of the given type and returns false.
     * Otherwise, returns true without issuing any requests.
     */
    public getStatusAndUpdateCache(request: RequestType, cachedItems: CachedItem<unknown>[]) {
        let currentGameState = getCurrentFullGameState();
        this.currentComputationId++;
        let isCurrent = true;
        let needsUpdate = false;
        for(let item of cachedItems) {
            // TODO better comparison
            if(JSON.stringify(currentGameState) != JSON.stringify(item.gameState)) {
                needsUpdate = true;
                isCurrent = false;
                item.gameState = currentGameState;
                item.computationId = this.currentComputationId;
                item.ongoingComputation = true;
            } else {
                // No need to issue an update request, but the cached value might still be stale
                if(item.ongoingComputation) {
                    isCurrent = false;
                }
                /* If there is no ongoing computation,
                 * then the cached value corresponds to the game state in item.gameState.
                 */
            }
        }
        if(needsUpdate) {
            let message: MessageToTheWorker = {
                request,
                computationId: this.currentComputationId,
                fullGameState: currentGameState,
            };
            this.worker.postMessage(message);
        }
        return isCurrent;
    }
}

/* The planner itself.
 * This is actually the only "global" element of this file.
 * Users could very well create their own instances of CoalescingLumpsPlanner,
 * they just wouldn't share the cache.
 */
export let planner = new CoalescingLumpsPlanner();
