export class DragonAuras {
    /* This class accounts for how the game handles the dragon's auras.
     *
     * In the end,
     * it is just a fancy way of enumerating the numbers 0, 0.1, 1, 1.1,
     * but with some fancy pretty-printing :)
     */
    constructor(public hasDragonsCurve:boolean, public hasRealityBending:boolean) {
    }
    toString() {
        if(this.hasDragonsCurve && this.hasRealityBending)
            return "both Dragon's Curve and Reality Bending on the dragon";
        else if(this.hasDragonsCurve)
            return "only Dragon's Curve on the dragon";
        else if(this.hasRealityBending)
            return "only Reality Bending on the dragon";
        else
            return "neither Dragon's Curve nor Reality Bending on the dragon";
    }
    auraValue() {
        return (this.hasDragonsCurve? 1 : 0) + (this.hasRealityBending? 0.1 : 0);
    }
    equal(dragon: DragonAuras) {
        return dragon instanceof DragonAuras
            && this.hasDragonsCurve === dragon.hasDragonsCurve
            && this.hasRealityBending === dragon.hasRealityBending;
    }
    static fromGame() {
        // Return the DragonAuras corresponding to the current in-game state.
        return new DragonAuras(Game.hasAura("Dragon's Curve"), Game.hasAura("Reality Bending"));
    }

    /* Makeshift enum!
     * All kinds of auras will be iterable via
     *  for(dragon of DragonAuras.all) {...}
     */
    static bothAuras: any;
    static onlyDragonsCurve:any;
    static onlyRealityBending:any;
    static neitherAuras:any;
    static all:any;
    static init() {
        // init() is called by CYOL.launch()
        this.bothAuras = new this(true, true);
        this.onlyDragonsCurve = new this(true, false);
        this.onlyRealityBending = new this(false, true);
        this.neitherAuras = new this(false, false);
        this.all = [this.neitherAuras, this.onlyRealityBending, this.onlyDragonsCurve, this.bothAuras];
    }
}
