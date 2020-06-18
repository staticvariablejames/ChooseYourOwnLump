function predictNextLumpType(dragonsCurve, realityBending, rigidelSlot, grandmaCount) {
    let dragonAura = 1 + (dragonsCurve? 1 : 0) + (realityBending? 0.1 : 0);

    let ripeAge = 23 * 60*60*1000; // 23 hours
    if (Game.Has('Stevia Caelestis')) ripeAge -= 60*1000;
    ripeAge -= 6000 * grandmaCount;
    ripeAge -= 20*60*1000 * rigidelSlot;
    ripeAge /= dragonAura;
    let autoharvestTime = Game.lumpT + ripeAge + 60*60*1000;

    Math.seedrandom(Game.seed+'/'+autoharvestTime);

    let types=['normal'];
    let loop = randomFloor(dragonAura);
    for (let i=0; i<loop; i++) {
        if (Math.random()<(Game.Has('Sucralosia Inutilis')?0.15:0.1)) types.push('bifurcated');
        if (Math.random()<3/1000) types.push('golden');
        if (Math.random()<0.1*Game.elderWrath) types.push('meaty');
        if (Math.random()<1/50) types.push('caramelized');
    }
    let lumpType = choose(types);
    Math.seedrandom();
    return lumpType;
}

function allPredictions(dragonsCurveAvailable, realityBendingAvailable, rigidelMaxSlot, maxGrandmas) {
    for(let dragonsCurve = 0; dragonsCurve <= dragonsCurveAvailable; dragonsCurve++) {
        for(let realityBending = 0; realityBending <= realityBendingAvailable; realityBending++) {
            for(let rigidelSlot = 0; rigidelSlot <= rigidelMaxSlot; rigidelSlot++) {
                for(let grandmaCount = 0; grandmaCount <= maxGrandmas; grandmaCount ++) {
                    if(predictNextLumpType(dragonsCurve, realityBending, rigidelSlot, grandmaCount) !== 0) {
                        console.log("Found: " + predictNextLumpType(dragonsCurve, realityBending, rigidelSlot, grandmaCount) + ", " + dragonsCurve + ", " + realityBending + ", " + rigidelSlot + ", " + grandmaCount);
                    }
                }
            }
        }
    }
}
