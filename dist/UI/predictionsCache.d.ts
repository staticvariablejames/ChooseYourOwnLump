import { TransientState } from '../transientState';
import { PersistentState } from '../persistentState';
export declare let cachedPredictions: TransientState[] | null;
export declare let cachedState: PersistentState | null;
export declare let cachedDiscrepancy: number;
export declare function computePredictions(): void;
