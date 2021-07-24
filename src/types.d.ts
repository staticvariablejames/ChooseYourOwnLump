/// <reference path="../node_modules/ccse-ts/index.d.ts" />
/* Declaration of types that will be present during runtime.
 */

declare global {
    var Spice: any;

    interface Math {
        seedrandom(seed?: string): void;
    }
}

export {} // Marks this as a module
