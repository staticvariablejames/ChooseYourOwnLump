import { FullGameState } from '../src/planner/types';
import { PlannerCore } from '../src/planner/core';
import { CachedConfigurationsProcessor } from '../src/planner/processing';
import { makeConfigurationsIterator } from '../src/planner/processing';

let defaultFullGameState: FullGameState = {
    gameState: {
        discrepancy: 1,
        hasSteviaCaelestis: false,
        hasSucralosiaInutilis: false,
        hasSugarAgingProcess: false,
        seed: 'james',
        currentLumpT: 1.6e12,
        currentRigidelSlot: 'none',
        currentGrandmaCount: 0,
        currentGrandmapocalypseStage: 1,
        currentHasDragonsCurve: false,
        currentHasRealityBending: false,
        currentHasSupremeIntellect: false,
    },
    preferences: {
        threeColumnDragonAuras: true,
        conditions: {
            preserveDragon: 'observe',
            preservePantheon: 'observe',
            preserveGrandmapocalypseStage: 'observe',
            respectBudget: 'observe',
        },
        includeType: {
            normal: false,
            bifurcated: false,
            golden: true,
            meaty: false,
            caramelized: true,
        },
    },
    budget: {
        maxGrandmas: 600,
        unlockedPantheon: true,
        unlockedDragonsCurve: true,
        unlockedRealityBending: true,
        unlockedSupremeIntellect: true,
        unlockedSecondAura: true,
    },
};

let commands: Record<string, () => void> = {
    'grandmaless-sad-seed-search': () => {
        let core = new PlannerCore({
            seed: 'mesad',
        });
        let found = false;
        while(!found) {
            core.currentLumpT++;
            found = true;
        middleLoop:
            for(let configuration of makeConfigurationsIterator(core)) {
                for(let type of core.lumpTypePredictionSet(configuration)) {
                    if(type != 'normal') {
                        found = false;
                        break middleLoop;
                    }
                }
            }
        }
        console.log(core.currentLumpT);
    },

    'grandmaful-goldenless': () => {
        let core = new PlannerCore({
            seed: 'glump',
            hasSteviaCaelestis: true,
            hasSugarAgingProcess: true,
        });
    outerLoop:
        while(true) {
            core.currentLumpT++;
            for(let configuration of makeConfigurationsIterator(core)) {
                if(core.lumpTypePredictionSet(configuration).some(t => t == 'golden')) {
                    continue outerLoop;
                }
            }
            break;
        }
        console.log(core.currentLumpT); // 1600000130706 (1600000165533 without Stevia Caelestis)
    },

    'single-golden-but-cant-sell-grandmas': () => {
        let core = new PlannerCore({
            seed: 'james',
            hasSugarAgingProcess: true,
            hasSteviaCaelestis: true,
            hasSucralosiaInutilis: true,
        });
        let hasGolden = false;

    outerLoop:
        while(true) {
            core.currentLumpT++;
            hasGolden = false;

        middleLoop:
            for(let hasDragonsCurve of [false, true])
            for(let hasRealityBending of [false, true])
            for(let effectiveGrandmaCount of [200, 400, 600]) {
                /* 200, 400, and 600 effective grandmas can be achieved with Rigidel alone,
                 * so we want at least one of these configurations to yield a golden lump,
                 * but only during the grandmapocalypse.
                 *
                 * 0 effective grandmas is not useful for us,
                 * because it has only one configuration (zero grandmas and unslotted Rigidel),
                 * so we cannot try to trick the filter into picking the "wrong" choice.
                 */
                let configuration = {hasDragonsCurve, hasRealityBending, effectiveGrandmaCount};
                let predictionSet = core.lumpTypePredictionSet(configuration);
                if(predictionSet[0] == 'golden') {
                    // We want this lump to be obtainable only during the grandmapocalypse
                    continue outerLoop; // try next currentLumpT
                }
                if(predictionSet.some(type => type == 'golden')) {
                    hasGolden = true;
                    break middleLoop;
                }
            }
            if(!hasGolden) continue;

            for(let configuration of makeConfigurationsIterator(core)) {
                if(configuration.effectiveGrandmaCount == 200 ||
                   configuration.effectiveGrandmaCount == 400 ||
                   configuration.effectiveGrandmaCount == 600)
                {
                    // Already checked those
                    continue;
                } else {
                    // Cannot have other golden lumps
                    if(core.lumpTypePredictionSet(configuration).some(type => type == 'golden')) {
                        continue outerLoop;
                    }
                }
            }
            break;
        }
        console.log(core.currentLumpT); // 1600054366361 (1600010834339 without Stevia Caelestis)
    },

    'single-golden-almost-as-fast-as-possible': () => {
        let core = new PlannerCore({
            seed: 'james',
            hasSugarAgingProcess: true,
            hasSucralosiaInutilis: true,
            hasSteviaCaelestis: true,
        });

    outerLoop:
        while(true) {
            core.currentLumpT++;

            let predictionsAlmostFastestConfiguration = core.lumpTypePredictionSet({
                effectiveGrandmaCount: 1200, hasDragonsCurve: true, hasRealityBending: false,
            });
            if(!predictionsAlmostFastestConfiguration.some(l => l == 'golden')) {
                continue;
            }

            for(let configuration of makeConfigurationsIterator(core)) {
                if(configuration.effectiveGrandmaCount == 1200 &&
                   configuration.hasDragonsCurve && !configuration.hasRealityBending)
                {
                    continue;
                }

                if(core.lumpTypePredictionSet(configuration).some(type => type == 'golden')) {
                    continue outerLoop;
                }
            }
            break;
        }
        console.log(core.currentLumpT); // 1600049146690
    },

    'single-golden-as-fast-as-possible': () => {
        let core = new PlannerCore({
            seed: 'james',
            hasSugarAgingProcess: true,
            hasSucralosiaInutilis: true,
            hasSteviaCaelestis: true,
        });

    outerLoop:
        while(true) {
            core.currentLumpT++;

            let predictionsFastestConfiguration = core.lumpTypePredictionSet({
                effectiveGrandmaCount: 1200, hasDragonsCurve: true, hasRealityBending: true
            });
            if(!predictionsFastestConfiguration.some(l => l == 'golden')) {
                continue;
            }

            let goldenCount = 0;
            for(let configuration of makeConfigurationsIterator(core)) {
                if(core.lumpTypePredictionSet(configuration).some(type => type == 'golden')) {
                    goldenCount++;
                }
                if(goldenCount >= 2) {
                    // goldenCount will quickly become 1 because of the guaranteed golden above
                    continue outerLoop;
                }
            }
            break;
        }
        console.log(core.currentLumpT); // 1600051862902 (1600028071294 without Stevia Caelestis)
    },

    'sugar-aging-process-stole-my-gold': () => {
        let core = new PlannerCore({
            seed: 'james',
            hasSugarAgingProcess: true,
            hasSteviaCaelestis: true,
        });
    outerLoop:
        while(true) {
            core.currentLumpT++;
            let foundGoodSetup = false;
            for(let hasDragonsCurve of [false, true])
            for(let hasRealityBending of [false, true]) {
                let predictionSetNoGrandmas = core.lumpTypePredictionSet({effectiveGrandmaCount: 0, hasDragonsCurve, hasRealityBending});
                if(predictionSetNoGrandmas[0] == 'golden') {
                    continue outerLoop;
                }
                if(predictionSetNoGrandmas.some(t => t == 'golden')) {
                    foundGoodSetup = true;
                }
            }
            if(!foundGoodSetup) continue outerLoop;

            // Now there shall be no other golden lumps
            for(let configuration of makeConfigurationsIterator(core)) {
                let predictionSet = core.lumpTypePredictionSet(configuration);
                if(configuration.effectiveGrandmaCount != 0) {
                    if(predictionSet.some(t => t == 'golden')) {
                        continue outerLoop;
                    }
                }
            }
            break;
        }
        console.log(core.currentLumpT); // 1600089387378 (1600109561973 without Stevia Caelestis)
    },

    'fancy-tooltip-with-grandmas': () => {
        let fullGameState = structuredClone(defaultFullGameState);
        fullGameState.gameState.hasSugarAgingProcess = true;
        fullGameState.gameState.currentHasRealityBending = true;
        fullGameState.gameState.currentHasDragonsCurve = true;
        fullGameState.gameState.currentGrandmaCount = 598;
        fullGameState.gameState.currentRigidelSlot = 'diamond';
        fullGameState.preferences.includeType = {normal: true, bifurcated: true, golden: true, meaty: true, caramelized: true};
        while(true) {
            fullGameState.gameState.currentLumpT++;
            let core = new PlannerCore(fullGameState.gameState);
            if(core.currentPrediction() != 'golden') continue;
            // Not quite the first five predictions but close enough
            let firstFivePredictionSets = Array.from(makeConfigurationsIterator(core).take(5).map(v => core.lumpTypePredictionSet(v)));
            if(new Set(firstFivePredictionSets.flat()).size < 5) continue;

            let hasMiddleStageOnlyPrediction = false;
            for(let set of firstFivePredictionSets) {
                if(set[1] != set[0] && set[1] != set[3]) hasMiddleStageOnlyPrediction = true;
                if(set[2] != set[0] && set[2] != set[3]) hasMiddleStageOnlyPrediction = true;
            }
            if(!hasMiddleStageOnlyPrediction) continue;

            let processor = new CachedConfigurationsProcessor(core);
            let report = processor.getFullListPlannerReport(fullGameState);

            if(report[1][0].grandmaCount != 600) continue;
            if(report.slice(0, 10).flat().length != 10) continue;
            if(report[9][0].grandmaCount! < 595) continue;
            break;
        }
        console.log(fullGameState.gameState.currentLumpT); // 1600002099695
    },

    'fancy-summary-tooltip-with-grandmas': () => {
        let fullGameState = structuredClone(defaultFullGameState);
        fullGameState.gameState.hasSugarAgingProcess = true;
        fullGameState.budget.maxGrandmas = 100;
        fullGameState.gameState.currentGrandmaCount = 100;
        fullGameState.gameState.currentGrandmapocalypseStage = 2;
        while(true) {
            fullGameState.gameState.currentLumpT++;
            let core = new PlannerCore(fullGameState.gameState);
            let processor = new CachedConfigurationsProcessor(core);
            let report = processor.getSummaryPlannerReport(fullGameState);
            if(report.caramelized!.length != 6) continue;
            if(report.golden!.length >= 4) continue;
            break;
        }
        console.log(fullGameState.gameState.currentLumpT); // 1600000000015; this was lucky
    },

    'fancy-tooltip-without-grandmas': () => {
        let fullGameState = structuredClone(defaultFullGameState);
        fullGameState.gameState.currentHasRealityBending = true;
        fullGameState.gameState.currentRigidelSlot = 'jade';
        fullGameState.preferences.threeColumnDragonAuras = false;
        fullGameState.gameState.currentGrandmapocalypseStage = 3;
        while(true) {
            fullGameState.gameState.currentLumpT++;
            let core = new PlannerCore(fullGameState.gameState);
            if(core.currentPrediction() != 'meaty') continue;
            let processor = new CachedConfigurationsProcessor(core);
            let report = processor.getFullListPlannerReport(fullGameState);

            if(report.length != 3) continue;
            if(report[0].length != 1) continue;
            if(report[1].length != 2) continue;
            if(report[2].length != 1) continue;
            if(report[0][0].lumpType != 'caramelized') continue;
            if(report[1][0].lumpType != 'golden') continue;
            if(report[2][0].lumpType != 'caramelized') continue;
            let hasWarning = report.some(
                predictionsSet => predictionsSet.some(
                    configuration => configuration.dragonAuras.some(
                        aura => aura.note == 'warn'
                    )
                )
            );
            if(!hasWarning) continue;
            let activeAurasSet = report.flat().map(e => e.dragonAuras).flat().
                filter(aura => aura.style == 'normal').map(aura => aura.aura);
            if(new Set(activeAurasSet).size != 3) continue;
            let grandmapocalypseStages = report.flat().map(e => e.grandmapocalypseStages).flat();
            if(grandmapocalypseStages.filter(v => v).length > 12) continue;

            break;
        }
        console.log(fullGameState.gameState.currentLumpT); // 1600000101424
    },
};

let command = process.argv[2];

if(process.argv.length != 3 || !(command in commands)) {
    console.log(`Available commands: ${Object.keys(commands).join(' ')}`);
} else {
    commands[command]();
}
