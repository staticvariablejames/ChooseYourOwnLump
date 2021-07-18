if(typeof exports == "undefined") var exports = {};
/* Typescript is configured with "target":"es3" and "module":"commonjs",
 * so the line
 *      exports.__esModule = true;
 * is generated in the output.
 * But importing stuff via Game.LoadMod is tantamount to a <script src="..."></script>,
 * without a "type=module" attribute,
 * so the `exports` object does not exist.
 * Defining `exports = {}` is a kludge that prevents that line from throwing an error.
 */

Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/dist/main.js');
