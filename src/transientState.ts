import { DragonAuras } from './dragonAuras';
import { currentRigidelSlot } from './UI/util';

/* Atttributes from the game that affect lump maturation time
 * which can be easily modified by the player.
 */
export class TransientState {
    public lumpType?: string;
    public autoharvestTime?: number;
    /* grandmapocalypseStage is a number between 0 and 3,
     * dragon is an object of DragonAuras,
     * rigidelSlot===0 means unslotted, 1 means Jade, 2 means Ruby, 3 means Diamond
     * (note that this is a different convention than the one used in minigamePantheon.js);
     * grandmaCount is the number of grandmas.
     *
     * For ease of use,
     * PersistentState.prototype.predictLumpType (and related method)
     * inject the properties 'lumpType' and 'autoharvestTime' into objects of this class.
     */
    constructor(
        public grandmapocalypseStage:number,
        public dragon:any,
        public rigidelSlot:number,
        public grandmaCount:number
    ) {}

    /* True if the only difference between the two states is the grandmapocalypseStage. */
    almostEqual(state: TransientState) {
        return state instanceof TransientState
            && this.dragon.equal(state.dragon)
            && this.rigidelSlot === state.rigidelSlot
            && this.grandmaCount === state.grandmaCount
            && this.lumpType === state.lumpType;
    }

    // Returns the current state of the game.
    static current() {
        let dragon = DragonAuras.fromGame();
        let grandmapocalypseStage = Game.elderWrath;
        let rigidelSlot = currentRigidelSlot();
        if (Game.BuildingsOwned % 10 != 0)
            rigidelSlot = 0;

        let grandmaCount = Game.Objects['Grandma'].amount;
        return new this(grandmapocalypseStage, dragon, rigidelSlot, grandmaCount);
    }

    static grandmalessStates = TransientState.initGrandmalessStates(); // All possible states without grandmas
    static grandmafulStates = TransientState.initGrandmafulStates(); // All possible (inequivalent) states with grandmas
    /* States which differ only in their grandmapocalypseStage are generated together.
     * This guarantees that they are grouped when sorting by autoharvestTime,
     * as Array.prototype.sort is stable. */

    private static initGrandmalessStates() {
        let states: TransientState[] = [];
        for(let dragon of DragonAuras.all) {
            for(let rigidelSlot = 0; rigidelSlot <= 3; rigidelSlot++) {
                for(let gStage = 0; gStage <= 3; gStage++) {
                    states.push(new this(
                        gStage, dragon, rigidelSlot, 0
                    ));
                }
            }
        }
        return states;
    }

    private static initGrandmafulStates() {
        let states: TransientState[] = [];

        for(let dragon of DragonAuras.all) {
            for(let rigidelSlot = 0; rigidelSlot <= 3; rigidelSlot++) {
                let grandmaCount = (rigidelSlot === 0 ? 0 : 401);
                /* Having n grandmas with Rigidel in slot k
                 * is the same thing as having n+200 grandmas with Rigidel in slot k-1.
                 * The condition above prevents equivalent configurations from being generated.
                 * It favors using grandmas instead of Rigidel;
                 * the idea is to maximize the usefulness of the pantheon
                 * for uses beyond this trick. */
                for(; grandmaCount <= 600; grandmaCount++) {
                    for(let gStage = 0; gStage <= 3; gStage++) {
                        states.push(new this(
                            gStage, dragon, rigidelSlot, grandmaCount
                        ));
                    }
                }
            }
        }
        return states;
    }
}
