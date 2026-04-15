import { PantheonSlot } from '../src/planner/types';
import { PlannerCore } from '../src/planner/core';
import { chromium as myBrowser } from 'playwright';
import { CCSave, SugarLumpTypesById, openCookieClickerPage } from 'cookie-connoisseur';

let dragonConfigurations = [
    {dc: false, rb: false, si: false, dragonAura:  0, dragonAura2:  0},
    {dc: false, rb: false, si: true,  dragonAura: 20, dragonAura2:  0},
    {dc: false, rb: true,  si: false, dragonAura: 18, dragonAura2:  0},
    {dc: false, rb: true,  si: true,  dragonAura: 18, dragonAura2: 20},
    {dc: true,  rb: false, si: false, dragonAura: 17, dragonAura2:  0},
    {dc: true,  rb: false, si: true,  dragonAura: 17, dragonAura2: 20},
    {dc: true,  rb: true,  si: false, dragonAura: 17, dragonAura2: 18},
];

setTimeout(async () => {
    let inspectedConfigurations = 0;
    let totalConfigurations = 3 * 2 * 2 * 4 * 602 * 4 * 7;
    let browser = await myBrowser.launch();
outerLoop:
    for(let discrepancy of [0, 1, 617])
    for(let hasSteviaCaelestis of [false, true])
    for(let hasSucralosiaInutilis of [false, true])
    for(let hasSugarAgingProcess of [false, true])
    for(let rigidelSlot of ['none', 'jade', 'ruby', 'diamond'] as PantheonSlot[])
    for(let grandmaCount = 0; grandmaCount <= (hasSugarAgingProcess ? 600 : 0); grandmaCount++)
    for(let grandmapocalypseStage of [0, 1, 2, 3])
    for(let dragonConfiguration of dragonConfigurations) {
        inspectedConfigurations++;
        console.log(`Inspecting configuration ${inspectedConfigurations} of ${totalConfigurations}`);

        let saveGame = CCSave.fromObject({
            seed: 'james',
            lumps: 1,
            lumpT: 1.6e12,
            buildings: {
                'Grandma': {
                    amount: grandmaCount,
                },
                'Temple': {
                    level: 1,
                    amount: 610 - grandmaCount,
                    minigame: rigidelSlot == 'none' ? {} : {[rigidelSlot + 'Slot']: 'order'},
                },
            },
            ownedUpgrades: (() => {
                let upgrades = [] as string[];
                if(hasSteviaCaelestis) upgrades.push('Stevia Caelestis');
                if(hasSucralosiaInutilis) upgrades.push('Sucralosia Inutilis');
                if(hasSugarAgingProcess) upgrades.push('Sugar aging process');
                return upgrades;
            })(),
            achievements: 'all',
            dragonLevel: 27,
            dragonAura: dragonConfiguration.dragonAura,
            dragonAura2: dragonConfiguration.dragonAura2,
            elderWrath: grandmapocalypseStage, // If grandmas == 0, only possible through save editing
        });

        let plannerCore = new PlannerCore({
            discrepancy,
            hasSteviaCaelestis,
            hasSucralosiaInutilis,
            hasSugarAgingProcess,
            seed: 'james',
            currentRigidelSlot: rigidelSlot,
            currentGrandmaCount: grandmaCount,
            currentGrandmapocalypseStage: grandmapocalypseStage,
            currentHasDragonsCurve: dragonConfiguration.dc,
            currentHasRealityBending: dragonConfiguration.rb,
            currentHasSupremeIntellect: dragonConfiguration.si,
        });

        let page, lumpTypeId;

        // Warm load
        page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12 + 86400 * 1000,
            saveGame: {
                buildings: {
                    'Temple': {
                        level: 1, // Forces the minigame to load
                        amount: 1,
                    },
                },
            },
        });
        lumpTypeId = await page.evaluate(({save, discrepancy}) => {
            CConnoisseur.setupDiscrepancy(discrepancy);
            Game.LoadSave(save);
            return Game.lumpCurrentType;
        }, {save: CCSave.toNativeSave(saveGame), discrepancy});
        await page.close();

        if(SugarLumpTypesById[lumpTypeId] != plannerCore.currentPrediction()) {
            console.log(`Wrong lump type! ` +
                        `Got ${SugarLumpTypesById[lumpTypeId]}, ` +
                        `expected ${plannerCore.currentPrediction()} (Game.LoadSave)`);
            console.log(plannerCore);
            break outerLoop;
        }

        // Cold load
        plannerCore.currentRigidelSlot = 'none'; // Rigidel can never be active on "cold loads"
        page = await openCookieClickerPage(browser, {
            saveGame,
            mockedDate: 1.6e12 + 86400 * 1000,
            forceDiscrepancy: discrepancy,
        });
        lumpTypeId = await page.evaluate(() => Game.lumpCurrentType);
        await page.close();

        if(SugarLumpTypesById[lumpTypeId] != plannerCore.currentPrediction()) {
            console.log(`Wrong lump type! ` +
                        `Got ${SugarLumpTypesById[lumpTypeId]}, ` +
                        `expected ${plannerCore.currentPrediction()} (window.localStorage)`);
            console.log(plannerCore);
            break outerLoop;
        }
    }
    await browser.close();
});
