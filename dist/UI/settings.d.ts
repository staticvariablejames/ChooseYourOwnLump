export declare let settings: {
    discrepancy: number;
    includeNormal: boolean;
    includeBifurcated: boolean;
    includeGolden: boolean;
    includeMeaty: boolean;
    includeCaramelized: boolean;
    preserveGrandmapocalypseStage: boolean;
    preserveDragon: boolean;
    preservePantheon: boolean;
    rowsToDisplay: number;
};
export declare function loadSettingsFrom(save: string): void;
export declare function exportSettings(): string;
export declare function effectiveDiscrepancy(): number;
export declare function targetTypes(): string[];
