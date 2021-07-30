import { TransientState } from './transientState';
export declare function rewriteCode(functionName: string, pattern: string, replacement: string): void;
export declare function formatPredictionState(transientState: TransientState, discrepancy: number): string;
export declare function predictNextLumpType(discrepancy: number, verbose?: boolean): string;
