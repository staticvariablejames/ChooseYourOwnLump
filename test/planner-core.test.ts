import { test, expect } from '@playwright/test';
import { PlannerRelevantState } from '../src/planner/core';
import { PantheonSlot } from '../src/planner/types';
import seedrandom from 'seedrandom';

test('Seedrandom works', () => {
    let prng = seedrandom('hello.');
    expect(prng()).toEqual(0.9282578795792454);
    expect(prng()).toEqual(0.3752569768646784);
    /* seedrandom has other methods,
     * but these two (constructor and function call) are the only ones relevant in Cookie Clicker.
     */
});

test('PlannerRelevantState.currentPrediction() works', () => {
    for(let [gpocState, lump] of [[0, 'golden'], [1, 'meaty'], [2, 'meaty'], [3, 'meaty']]) {
        expect(new PlannerRelevantState({
            discrepancy: 1,
            hasSugarAgingProcess: true,
            currentLumpT: 1.6e12,
            currentSeed: 'james',
            currentRigidelSlot: 'diamond',
            currentGrandmaCount: 542,
            currentGrandmapocalypseStage: gpocState as number,
            currentHasDragonsCurve: true,
            currentHasRealityBending: false,
            currentHasSupremeIntellect: false,
        }).currentPrediction()).toEqual(lump);
    }

    for(let [gpocState, lump] of [[0, 'normal'], [1, 'normal'], [2, 'golden'], [3, 'meaty']]) {
        expect(new PlannerRelevantState({
            discrepancy: 1,
            hasSugarAgingProcess: true,
            currentLumpT: 1.6e12,
            currentSeed: 'james',
            currentRigidelSlot: 'diamond',
            currentGrandmaCount: 448,
            currentGrandmapocalypseStage: gpocState as number,
            currentHasDragonsCurve: true,
            currentHasRealityBending: false,
            currentHasSupremeIntellect: false,
        }).currentPrediction()).toEqual(lump);
    }

    for(let [grandmas, lump] of [[528, 'caramelized'], [575, 'bifurcated'], [595, 'bifurcated'], [600, 'caramelized'], [601, 'caramelized'], [602, 'caramelized']]) {
        expect(new PlannerRelevantState({
            discrepancy: 1,
            hasSugarAgingProcess: true,
            currentLumpT: 1.6e12,
            currentSeed: 'james',
            currentRigidelSlot: 'ruby',
            currentGrandmaCount: grandmas as number,
            currentGrandmapocalypseStage: 0,
            currentHasDragonsCurve: true,
            currentHasRealityBending: false,
            currentHasSupremeIntellect: false,
        }).currentPrediction()).toEqual(lump);
    }

    for(let [slot, lump] of [['none', 'normal'], ['jade', 'golden'], ['ruby', 'normal'], ['diamond', 'bifurcated']]) {
        expect(new PlannerRelevantState({
            discrepancy: 0,
            hasSugarAgingProcess: true,
            hasSteviaCaelestis: true,
            currentLumpT: 1.6e12,
            currentSeed: 'james',
            currentRigidelSlot: slot as PantheonSlot,
            currentGrandmaCount: 506,
            currentGrandmapocalypseStage: 0,
            currentHasDragonsCurve: false,
            currentHasRealityBending: false,
            currentHasSupremeIntellect: false,
        }).currentPrediction()).toEqual(lump);
    }

    for(let [slot, lump] of [['none', 'normal'], ['jade', 'normal'], ['ruby', 'bifurcated'], ['diamond', 'bifurcated']]) {
        expect(new PlannerRelevantState({
            discrepancy: 0,
            hasSugarAgingProcess: true,
            hasSteviaCaelestis: true,
            currentLumpT: 1.6e12,
            currentSeed: 'james',
            currentRigidelSlot: slot as PantheonSlot,
            currentGrandmaCount: 506,
            currentGrandmapocalypseStage: 0,
            currentHasDragonsCurve: false,
            currentHasRealityBending: false,
            currentHasSupremeIntellect: true,
        }).currentPrediction()).toEqual(lump);
    }

    for(let [gpocState, lump] of [[0, 'golden'], [1, 'golden'], [2, 'golden'], [3, 'meaty']]) {
        expect(new PlannerRelevantState({
            discrepancy: 1,
            hasSugarAgingProcess: true,
            hasSteviaCaelestis: true,
            currentLumpT: 1.6e12,
            currentSeed: 'james',
            currentRigidelSlot: 'none',
            currentGrandmaCount: 215,
            currentGrandmapocalypseStage: gpocState as number,
            currentHasDragonsCurve: false,
            currentHasRealityBending: true,
            currentHasSupremeIntellect: true,
        }).currentPrediction()).toEqual(lump);
    }

    for(let [hasSucralosia, lump] of [[false, 'golden'], [true, 'bifurcated']]) {
        expect(new PlannerRelevantState({
            discrepancy: 1,
            hasSugarAgingProcess: true,
            hasSteviaCaelestis: true,
            hasSucralosiaInutilis: hasSucralosia as boolean,
            currentLumpT: 1.6e12,
            currentSeed: 'james',
            currentRigidelSlot: 'ruby',
            currentGrandmaCount: 426,
            currentGrandmapocalypseStage: 3,
            currentHasDragonsCurve: true,
            currentHasRealityBending: true,
            currentHasSupremeIntellect: false,
        }).currentPrediction()).toEqual(lump);
    }
});
