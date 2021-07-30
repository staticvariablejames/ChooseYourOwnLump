import { TransientState } from './transientState';
export declare class PersistentState {
    seed: string;
    lumpT: number;
    hasSteviaCaelestis: boolean;
    hasSucralosiaInutilis: boolean;
    hasSugarAgingProcess: boolean;
    constructor(seed: string, // Corresponds to Game.seed
    lumpT: number, // Time that the current lump type started coalescing
    hasSteviaCaelestis: boolean, hasSucralosiaInutilis: boolean, hasSugarAgingProcess: boolean);
    allPredictions(discrepancy: number): TransientState[];
    predictLumpType(transientState: TransientState, discrepancy: number, verbose?: boolean): string;
    equal(state: unknown): boolean;
    static current(): PersistentState;
}
