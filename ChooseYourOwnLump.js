function predictLumpType(grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, grandmaCount, verbose) {
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
                        let lumpType = predictLumpType(grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, grandmaCount);
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

/* Patches Game.loadLumps function so that it is deterministic.
 * The code below is essentially Game.loadLumps,
 * but with a single call to Date.now() instead of three.
 * This makes so that the exploit above works every time.
 */
Game.loadLumps=function(time)
{
    Game.computeLumpTimes();
    if (!Game.canLumps()) Game.removeClass('lumpsOn');
    else
    {
        if (Game.ascensionMode!=1) Game.addClass('lumpsOn');
        let now = Date.now();
        Game.lumpT=Math.min(now,Game.lumpT);
        var age=Math.max(now-Game.lumpT,0);
        var amount=Math.floor(age/Game.lumpOverripeAge);
        if (amount>=1)
        {
            Game.harvestLumps(1,true);
            Game.lumpCurrentType=0;
            if (amount>1) Game.harvestLumps(amount-1,true);
            if (Game.prefs.popups) Game.Popup('Harvested '+Beautify(amount)+' sugar lump'+(amount==1?'':'s')+' while you were away');
            else Game.Notify('','You harvested <b>'+Beautify(amount)+'</b> sugar lump'+(amount==1?'':'s')+' while you were away.',[29,14]);
            Game.lumpT=now-(age-amount*Game.lumpOverripeAge);
            Game.computeLumpType();
        }
    }
}

function earlyGamePredictions() {
    allPredictions(['bifurcated', 'golden', 'meaty', 'caramelized'], false);
}

function lateGamePredictions() {
    allPredictions(['golden'], true);
}

function predictNextLumpType(verbose) {
    let grandmapocalypseStage = Game.elderWrath;
    let dragonsCurve = Game.hasAura("Dragon's Curve");
    let realityBending = Game.hasAura("Reality Bending");
    let rigidelSlot = 0;
    if (Game.hasGod && Game.BuildingsOwned%10==0 && Game.hasGod('order'))
        rigidelSlot = 4 - Game.hasGod('order');

    let effectiveGrandmas = Math.min(600,Game.Objects['Grandma'].amount);
    if (!Game.Has('Sugar aging process'))
        effectiveGrandmas = 0;

    return predictLumpType(grandmapocalypseStage, dragonsCurve, realityBending, rigidelSlot, effectiveGrandmas, verbose);
}
