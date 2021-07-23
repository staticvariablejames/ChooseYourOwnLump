/* Declaration of types that will be present during runtime.
 */

declare global {
    var CCSE: any;
    var Game: any;
    var Spice: any;

    function randomFloor(x: number): number;
    function choose(arr: any): any;

    interface Math {
        seedrandom(seed?: string): void;
    }
}

export {} // Marks this as a module
