/* Declaration of types that will be present during runtime.
 */

declare global {
    var CCSE: any;
    var Spice: any;

    interface Math {
        seedrandom(seed?: string): void;
    }

    namespace Game {
        export let customLumpTooltip: undefined | ( (str: string, phase: number) => String )[];
        export let customOptionsMenu: undefined | ( () => void )[];
        export let customStatsMenu: undefined | ( () => void )[];
    }
}

export {} // Marks this as a module
