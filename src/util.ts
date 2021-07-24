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

/* Stringify the prediction state in a readable way. */
export function formatPredictionState(transientState:TransientState, discrepancy:number) {
    let str = "Lump type: " + transientState.lumpType + ", with ";
    if(transientState.grandmaCount !== undefined) str += transientState.grandmaCount + " ";
    if(transientState.grandmapocalypseStage == 0) str += "appeased grandmas, ";
    if(transientState.grandmapocalypseStage == 1) str += "awoken grandmas, ";
    if(transientState.grandmapocalypseStage == 2) str += "displeased grandmas, ";
    if(transientState.grandmapocalypseStage == 3) str += "angered grandmas, ";

    str += transientState.dragon + ", ";

    if(transientState.rigidelSlot == 0) str += "Rigidel unslotted,";
    if(transientState.rigidelSlot == 1) str += "Rigidel on Jade slot,";
    if(transientState.rigidelSlot == 2) str += "Rigidel on Ruby slot,";
    if(transientState.rigidelSlot == 3) str += "Rigidel on Diamond slot,";

    str += " and " + discrepancy + " of discrepancy.";

    return str;
}

export function predictNextLumpType(discrepancy: number, verbose: boolean = false) {
    let transientState = TransientState.current();
    let persistentState = PersistentState.current();
    return persistentState.predictLumpType(transientState, discrepancy, verbose);
}
