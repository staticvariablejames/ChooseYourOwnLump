function predictNextLumpType(grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, grandmaCount, verbose) {
    let dragonAura = (dragonsCurve? 1 : 0) + (realityBending? 0.1 : 0);

    let ripeAge = 23 * 60*60*1000; // 23 hours
    if (Game.Has('Stevia Caelestis')) ripeAge -= 60*60*1000;
    ripeAge -= 6*1000 * grandmaCount;
    ripeAge -= 20*60*1000 * rigidelSlot;
    ripeAge /= 1 + 0.05*dragonAura;
    let autoharvestTime = Math.floor(Game.lumpT) + ripeAge + 60*60*1000;
    /* This technique for choosing the lump type
     * only really works if we save the game and load it _after_ the autoharvest time.
     * However, although the game works just fine using fractional Game.lumpT values,
     * the game truncates the number when saving.
     * Thus we must assume that we have the truncated number here.
     */

    Math.seedrandom(Game.seed+'/'+autoharvestTime);

    let types=['normal'];
    let loop = 1 + randomFloor(dragonAura);
    for (let i=0; i<loop; i++) {
        if (Math.random()<(Game.Has('Sucralosia Inutilis')?0.15:0.1)) types.push('bifurcated');
        if (Math.random()<3/1000) types.push('golden');
        if (Math.random()<0.1*grandmapocalypseStage) types.push('meaty');
        if (Math.random()<1/50) types.push('caramelized');
    }
    let lumpType = choose(types);
    Math.seedrandom();

    if(verbose) console.log("Predicted type: " + lumpType + ", ripe age: " + ripeAge + ", autoharvest time: " + autoharvestTime);
    return lumpType;
}

function allPredictions(targetTypes, hasSugarAgingProcess) {
    let maxGrandmas = hasSugarAgingProcess ? 600 : 0;
    for(let dragonsCurve = 0; dragonsCurve <= 1; dragonsCurve++) {
        for(let realityBending = 0; realityBending <= 1; realityBending++) {
            for(let rigidelSlot = 0; rigidelSlot <= 3; rigidelSlot++) {
                for(let grandmaCount = 0; grandmaCount <= maxGrandmas; grandmaCount ++) {
                    for(let grandmapocalypseStage = 0; grandmapocalypseStage <= 3; grandmapocalypseStage++) {
                        let lumpType = predictNextLumpType(grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, grandmaCount);
                        if(targetTypes.includes(lumpType)) {
                            prettyPrintPredictionState(lumpType, grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, hasSugarAgingProcess ? grandmaCount : -1);
                        }
                    }
                }
            }
        }
    }
}

function prettyPrintPredictionState(lumpType, grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, grandmaCount) {
    let str = "Lump type: " + lumpType + ", with ";
    if(grandmaCount !== -1) str += grandmaCount + " ";
    if(grandmapocalypseStage == 0) str += "appeased grandmas, ";
    if(grandmapocalypseStage == 1) str += "awoken grandmas, ";
    if(grandmapocalypseStage == 2) str += "displeased grandmas, ";
    if(grandmapocalypseStage == 3) str += "angered grandmas, ";

    if(dragonsCurve && realityBending) str += "both Dragon's Curve and Reality Bending on the dragon, ";
    if(!dragonsCurve && realityBending) str += "only Reality Bending on the dragon, ";
    if(dragonsCurve && !realityBending) str += "only Dragon's Curve on the dragon, ";
    if(!dragonsCurve && !realityBending) str += "neither Dragon's Curve nor Reality Bending on the dragon, ";

    if(rigidelSlot == 0) str += "and Rigidel unslotted.";
    if(rigidelSlot == 1) str += "and Rigidel on Jade slot.";
    if(rigidelSlot == 2) str += "and Rigidel on Ruby slot.";
    if(rigidelSlot == 3) str += "and Rigidel on Diamond slot.";

    console.log(str);
}

function earlyGamePredictions() {
    allPredictions(['bifurcated', 'golden', 'meaty', 'caramelized'], false);
}

function lateGamePredictions() {
    allPredictions(['golden'], true);
}
