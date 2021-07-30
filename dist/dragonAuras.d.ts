export declare class DragonAuras {
    hasDragonsCurve: boolean;
    hasRealityBending: boolean;
    constructor(hasDragonsCurve: boolean, hasRealityBending: boolean);
    toString(): "both Dragon's Curve and Reality Bending on the dragon" | "only Dragon's Curve on the dragon" | "only Reality Bending on the dragon" | "neither Dragon's Curve nor Reality Bending on the dragon";
    auraValue(): number;
    equal(dragon: DragonAuras): boolean;
    static fromGame(): DragonAuras;
    static bothAuras: DragonAuras;
    static onlyDragonsCurve: DragonAuras;
    static onlyRealityBending: DragonAuras;
    static neitherAuras: DragonAuras;
    static all: DragonAuras[];
}
