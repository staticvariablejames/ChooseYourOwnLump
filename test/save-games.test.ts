import { test, expect } from '@playwright/test';
import { CCSave, openCookieClickerPage, setupCookieClickerPage } from 'cookie-connoisseur';

import { name, version } from '../src/modInfo';
import { getDefaultPreferences } from '../src/preferences';
import { getPreferencesFromObject } from '../src/saveDataManagement';
import type { SaveData } from '../src/saveDataManagement';

test.describe('Can load a legacy save game', () => {
    let legacyId = "Choose your own lump";
    let saveWithLegacyData = CCSave.fromObject({
        modSaveData: {
            [legacyId]: {
                version: "1.3.2",
                settings: {
                    discrepancy: 3,
                    includeNormal: true,
                    includeBifurcated: true,
                    includeGolden: false,
                    includeMeaty: true,
                    includeCaramelized: true,
                    preserveGrandmapocalypseStage: true,
                    preserveDragon: true,
                    preservePantheon: true,
                    rowsToDisplay: 15,
                },
            },
        },
    });

    let actualSettings = {
        discrepancy: 3,
        display: {
            compactGrandmapocalypseRepresentation: false,
            rows: 15,
            reportType: 'fullList',
        },
        filtering: {
            conditions: {
                preserveDragon: 'require',
                preservePantheon: 'require',
                preserveGrandmapocalypseStage: 'require',
                respectBudget: 'observe',
            },
            includeType: {
                normal: true,
                bifurcated: true,
                golden: false,
                meaty: true,
                caramelized: true,
            },
        },
    };

    test('from localStorage', async ({page}) => {
        page = await setupCookieClickerPage(page, {saveGame: saveWithLegacyData});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        expect(await page.evaluate(() => window.CYOL.preferences)).toMatchObject(actualSettings);

        // Check that the legacy mod data is gone from Game.modSaveData
        expect(await page.evaluate((id) => id in Game.modSaveData, legacyId)).toBeFalsy();
        let save = CCSave.fromNativeSave(await page.evaluate(() => Game.WriteSave(1)));
        expect(legacyId in save.modSaveData).toBeFalsy();
        expect(name in save.modSaveData).toBeTruthy();
    });

    test('from file', async ({page}) => {
        page = await setupCookieClickerPage(page);
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        await page.evaluate(save => Game.LoadSave(save), CCSave.toNativeSave(saveWithLegacyData));

        expect(await page.evaluate((id) => id in Game.modSaveData, legacyId)).toBeFalsy();
        let save = CCSave.fromNativeSave(await page.evaluate(() => Game.WriteSave(1)));
        expect(legacyId in save.modSaveData).toBeFalsy();
        expect(name in save.modSaveData).toBeTruthy();
    });

    test('from file, over existing legacy save', async ({page}) => {
        page = await setupCookieClickerPage(page, {saveGame: saveWithLegacyData});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        await page.evaluate(save => Game.LoadSave(save), CCSave.toNativeSave(saveWithLegacyData));

        expect(await page.evaluate((id) => id in Game.modSaveData, legacyId)).toBeFalsy();
        let save = CCSave.fromNativeSave(await page.evaluate(() => Game.WriteSave(1)));
        expect(legacyId in save.modSaveData).toBeFalsy();
        expect(name in save.modSaveData).toBeTruthy();
    });

    test('from file, even over existing save', async ({page}) => {
        page = await setupCookieClickerPage(page, {saveGame: {
            modSaveData: {
                [name]: {
                    preferences: {
                        filtering: {
                            conditions: {
                                respectBudget: 'ignore',
                            },
                        },
                    },
                },
            },
        }});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        // Check the localStorage save has loaded
        expect(await page.evaluate(() => window.CYOL.preferences.filtering.conditions.respectBudget)).toEqual('ignore');

        // Load legacy save and test it
        await page.evaluate(save => Game.LoadSave(save), CCSave.toNativeSave(saveWithLegacyData));
        expect(await page.evaluate((id) => id in Game.modSaveData, legacyId)).toBeFalsy();
        let save = CCSave.fromNativeSave(await page.evaluate(() => Game.WriteSave(1)));
        expect(legacyId in save.modSaveData).toBeFalsy();
        expect(name in save.modSaveData).toBeTruthy();
    });
});

/* Ideally this should be tested within the browser, as part of CYOL.load,
 * but I don't know how to assert that something has thrown an exception inside the web page.
 */
test('getPreferencesFromObject warnings', () => {
    expect(() => {
        getPreferencesFromObject({missingSetting: true});
    }).toThrow(/missingSetting does not exist/);
    expect(() => {
        getPreferencesFromObject({discrepancy: 'yes'});
    }).toThrow(/Mistyped property.*discrepancy/);
    expect(() => {
        getPreferencesFromObject({filtering: null});
    }).toThrow(/filtering is null/);
    expect(getPreferencesFromObject({})).toEqual(getDefaultPreferences());
});

test('Can write and read save games', async ({browser}) => {
    let page = await openCookieClickerPage(browser);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    let expectedSaveData: SaveData = {
        version,
        preferences: getDefaultPreferences(),
    };

    let save1 = await page.evaluate(() => Game.WriteSave(1));
    let save1modSaveData = CCSave.fromNativeSave(save1).modSaveData;
    expect(name in save1modSaveData).toBeTruthy();
    expect(save1modSaveData[name]).toEqual(expectedSaveData);

    await page.getByText('Options').click();
    await page.getByText('Normal OFF').click();
    await page.locator('#CYOL-slider-preserveGrandmapocalypseStage').fill('0');

    // Check it overrides the current settings
    let save2 = await page.evaluate(() => Game.WriteSave(1));
    await page.evaluate((save: string) => Game.LoadSave(save), save1);
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedSaveData.preferences);

    // Check the old settings were preserved in save2
    expectedSaveData.preferences.filtering.includeType.normal = true;
    expectedSaveData.preferences.filtering.conditions.preserveGrandmapocalypseStage = 'require';
    await page.evaluate(save => Game.LoadSave(save), save2);
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedSaveData.preferences);

    await page.close();

    // Check that everything still works when loading from localStorage
    page = await openCookieClickerPage(browser, {saveGame: {
        modSaveData: {
            [name]: expectedSaveData,
        },
    }});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedSaveData.preferences);
    await page.close();
});

test('Data is erased on reset', async ({browser}) => {
    let page = await openCookieClickerPage(browser, { saveGame: {
        modSaveData: {
            [name]: {
                preferences: {
                    discrepancy: 2,
                },
            },
        },
    }});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    // Wipe save
    await page.getByText('Options', { exact: true }).click();
    await page.getByText('Wipe save').click();
    await page.getByText('Yes!').click();
    await page.getByText('Do it!').click();

    expect(await page.evaluate(() => window.CYOL.preferences.discrepancy)).toEqual(1);
    await page.close();
});
