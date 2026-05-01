/* Injects or modifies the Game function with the given name.
 * `pattern` and `replacement` are the first and second arguments to String.prototype.replace.
 */
type GameFunction = { [k in keyof typeof Game]: typeof Game[k] extends Function ? k : never }[keyof typeof Game];

export function rewriteCode(functionName: GameFunction, pattern: string, replacement: string) {
    let code = Game[functionName].toString();
    let newCode = code.replace(pattern, replacement);
    let indirectEval = eval; // <https://rolldown.rs/guide/troubleshooting#avoiding-direct-eval>
    Game[functionName] = indirectEval(`(${newCode})`);
}
