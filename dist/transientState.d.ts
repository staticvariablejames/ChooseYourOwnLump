import { DragonAuras } from './dragonAuras';
export declare class TransientState {
    grandmapocalypseStage: number;
    dragon: DragonAuras;
    rigidelSlot: number;
    grandmaCount: number;
    lumpType?: string;
    autoharvestTime?: number;
    constructor(grandmapocalypseStage: number, dragon: DragonAuras, rigidelSlot: number, grandmaCount: number);
    almostEqual(state: TransientState): boolean;
    static current(): TransientState;
    static grandmalessStates: TransientState[];
    static grandmafulStates: TransientState[];
    private static initGrandmalessStates;
    private static initGrandmafulStates;
}
