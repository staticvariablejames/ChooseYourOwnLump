function predictLumpType(grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, grandmaCount, discrepancy, verbose) {
    let dragonAura = (dragonsCurve? 1 : 0) + (realityBending? 0.1 : 0);

    let ripeAge = 23 * 60*60*1000; // 23 hours
    if (Game.Has('Stevia Caelestis')) ripeAge -= 60*60*1000;
    ripeAge -= 6*1000 * grandmaCount;
    ripeAge -= 20*60*1000 * rigidelSlot;
    ripeAge /= 1 + 0.05*dragonAura;
    let autoharvestTime = Math.floor(Game.lumpT) + ripeAge + 60*60*1000 + discrepancy;
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

function allPredictions(targetTypes, hasSugarAgingProcess, discrepancy) {
    let maxGrandmas = hasSugarAgingProcess ? 600 : 0;
    for(let dragonsCurve = 0; dragonsCurve <= 1; dragonsCurve++) {
        for(let realityBending = 0; realityBending <= 1; realityBending++) {
            for(let rigidelSlot = 0; rigidelSlot <= 3; rigidelSlot++) {
                for(let grandmaCount = 0; grandmaCount <= maxGrandmas; grandmaCount ++) {
                    for(let grandmapocalypseStage = 0; grandmapocalypseStage <= 3; grandmapocalypseStage++) {
                        let lumpType = predictLumpType(grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, grandmaCount, discrepancy);
                        if(targetTypes.includes(lumpType)) {
                            prettyPrintPredictionState(lumpType, grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, hasSugarAgingProcess ? grandmaCount : -1, discrepancy);
                        }
                    }
                }
            }
        }
    }
}

function prettyPrintPredictionState(lumpType, grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, grandmaCount, discrepancy) {
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

    if(rigidelSlot == 0) str += "Rigidel unslotted,";
    if(rigidelSlot == 1) str += "Rigidel on Jade slot,";
    if(rigidelSlot == 2) str += "Rigidel on Ruby slot,";
    if(rigidelSlot == 3) str += "Rigidel on Diamond slot,";

    str += " and " + discrepancy + " of discrepancy.";

    console.log(str);
}

function earlyGamePredictions(discrepancy) {
    if(discrepancy === undefined) {
        throw new Error("Missing discrepancy parameter");
    }
    allPredictions(['bifurcated', 'golden', 'meaty', 'caramelized'], false, discrepancy);
}

function lateGamePredictions(discrepancy) {
    if(discrepancy === undefined) {
        throw new Error("Missing discrepancy parameter");
    }
    allPredictions(['golden'], true, discrepancy);
}

function predictNextLumpType(discrepancy, verbose) {
    if(discrepancy === undefined) {
        throw new Error("Missing discrepancy parameter");
    }

    let grandmapocalypseStage = Game.elderWrath;
    let dragonsCurve = Game.hasAura("Dragon's Curve");
    let realityBending = Game.hasAura("Reality Bending");
    let rigidelSlot = 0;
    if (Game.hasGod && Game.BuildingsOwned%10==0 && Game.hasGod('order'))
        rigidelSlot = 4 - Game.hasGod('order');

    let effectiveGrandmas = Math.min(600,Game.Objects['Grandma'].amount);
    if (!Game.Has('Sugar aging process'))
        effectiveGrandmas = 0;

    return predictLumpType(grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, effectiveGrandmas, discrepancy, verbose);
}
