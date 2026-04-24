/* Injects or modifies the function with the given name.
 * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
 */
export function rewriteCode(functionName: string, pattern: string, replacement: string) {
    let code = eval(functionName + ".toString()");
    let newCode = code.replace(pattern, replacement);
    eval(functionName + " = " + newCode);
}
