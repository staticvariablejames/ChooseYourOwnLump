import { TransientState } from './transientState';
import { PersistentState } from './persistentState';

/* Injects or modifies the function with the given name.
 * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
 */
export function rewriteCode(functionName: string, pattern: string, replacement: string) {
    let code = eval(functionName + ".toString()");
    let newCode = code.replace(pattern, replacement);
    eval(functionName + " = " + newCode);
}

export function predictNextLumpType(discrepancy: number, verbose: boolean = false) {
    let transientState = TransientState.current();
    let persistentState = PersistentState.current();
    return persistentState.predictLumpType(transientState, discrepancy, verbose);
}
