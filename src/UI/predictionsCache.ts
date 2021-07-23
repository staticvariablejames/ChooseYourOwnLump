import { TransientState } from '../transientState';
import { PersistentState } from '../persistentState';
import { effectiveDiscrepancy } from './settings';

export let cachedPredictions: TransientState[] | null = null;
export let cachedState: PersistentState | null = null; // the PersistentState that was used to compute cachedPredictions
export let cachedDiscrepancy: number = -1;

/* Recomputes cachedPredictions if cachedState differs from the current state,
 * or if cachedPredictions === null. */
export function computePredictions() {
    let currentState = PersistentState.current();
    if(currentState.equal(cachedState)
        && cachedPredictions !== null
        && cachedDiscrepancy === effectiveDiscrepancy()
    ) {
        return;
    }
    cachedState = currentState;
    cachedDiscrepancy = effectiveDiscrepancy();
    cachedPredictions = currentState.allPredictions(effectiveDiscrepancy());
}
