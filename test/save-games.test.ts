import { Page } from 'playwright';
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

        expect(await page.evaluate(() => window.CYOL.preferences)).toMatchObject(actualSettings);
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

        expect(await page.evaluate(() => window.CYOL.preferences)).toMatchObject(actualSettings);
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
        expect(await page.evaluate(() => window.CYOL.preferences)).toMatchObject(actualSettings);
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
        storedDiscrepancyInfo: {
            lumpT: 1.6e12 + 123,
            lumpOverripeAge: 86400 * 1000,
        },
    };

    await page.evaluate(() => {
        Game.Earn(1e9); // Unlock lumps
        Game.lumps = Game.lumpsTotal = 0;
        Game.lumpT = 1.6e12+123;
    });

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

test('Mod state is erased on reset, but not preferences', async ({browser}) => {
    let page = await openCookieClickerPage(browser, { saveGame: {
        modSaveData: {
            [name]: {
                preferences: {
                    discrepancy: 2,
                },
                storedDiscrepancyInfo: {
                    lumpT: 1.6e12,
                    lumpOverripeAge: 86400 * 1000,
                },
            },
        },
    }});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    await page.waitForFunction(() => window.CYOL.discrepancyInfo.available);

    // Wipe save
    await page.getByText('Options', { exact: true }).click();
    await page.getByText('Wipe save').click();
    await page.getByText('Yes!').click();
    await page.getByText('Do it!').click();

    expect(await page.evaluate(() => window.CYOL.preferences.discrepancy)).toEqual(2);
    expect(await page.evaluate(() => window.CYOL.discrepancyInfo.available)).toBeFalsy();
    await page.close();
});

test.describe('Discrepancy information', () => {
    let defaultSaveGame = {
        lumps: 1,
        lumpT: 1.6e12,
        achievements: 'all',
        modSaveData: {
            [name]: {
                storedDiscrepancyInfo: {
                    lumpT: 1.6e12,
                    lumpOverripeAge: 86400 * 1000,
                },
            },
        },
    };

    // Destroy any existing CYOL.discrepancyInfo
    async function destroyDiscrepancyInfo(page: Page) {
        await page.evaluate(() => {
            window.CYOL.discrepancyInfo.available = false;
            window.CYOL.discrepancyInfo.previous = {lumpT: 0, lumpOverripeAge: 0};
            window.CYOL.discrepancyInfo.current = {lumpT: 0, lumpOverripeAge: 0};
            window.CYOL.discrepancyInfo.expectedDiscrepancy = 42;
        });
    }

    test('Is not available on localStorage loads if not present in the save game', async ({browser}) => {
        let page = await openCookieClickerPage(browser);
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        await page.waitForFunction(() => { // Basically we wait for all possible setTimeouts to process
            setTimeout(() => (window as any).waitedLongEnough = true);
            return Boolean((window as any).waitedLongEnough);
        });
        expect(await page.evaluate(() => window.CYOL.discrepancyInfo.available)).toBeFalsy();
        await page.close();
    });

    for(let discrepancy of [0, 1, 617])
    test.describe('Is accurate when the discrepancy is ' + discrepancy, () => {
        let expectedDiscrepancyInfo = {
            available: true,
            previous: {
                lumpT: 1.6e12,
                lumpOverripeAge: 86400 * 1000,
            },
            current: {
                lumpT: 1.6e12 + 86400 * 1000 + discrepancy,
                lumpOverripeAge: 86400 * 1000,
            },
            expectedDiscrepancy: 1,
        };

        test('when loading from localStorage', async ({browser}) => {
            let page = await openCookieClickerPage(browser, {
                mockedDate: 1.6e12 + 86400 * 1000 + 1000,
                forceDiscrepancy: discrepancy,
                saveGame: defaultSaveGame,
            });
            await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
            await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

            expect(await page.evaluate(() => window.CYOL.discrepancyInfo)).toMatchObject(expectedDiscrepancyInfo);
            await page.close();
        });

        test('when loading from save data with storedDiscrepancyInfo', async ({browser}) => {
            let page = await openCookieClickerPage(browser, {
                mockedDate: 1.6e12 + 86400 * 1000 + 1000,
            });
            await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
            await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

            let save = CCSave.toNativeSave(CCSave.fromObject(defaultSaveGame));
            await destroyDiscrepancyInfo(page);
            await page.evaluate(({save, discrepancy}) => {debugger; CConnoisseur.setupDiscrepancy(discrepancy); Game.LoadSave(save)}, {save, discrepancy});
            await page.waitForFunction(() => window.CYOL.discrepancyInfo.available);
            expect(await page.evaluate(() => window.CYOL.discrepancyInfo)).toMatchObject(expectedDiscrepancyInfo);

            // Do it again, this time over a page with an existing save
            await destroyDiscrepancyInfo(page);
            await page.evaluate(({save, discrepancy}) => {CConnoisseur.setupDiscrepancy(discrepancy); Game.LoadSave(save)}, {save, discrepancy});
            await page.waitForFunction(() => window.CYOL.discrepancyInfo.available);
            expect(await page.evaluate(() => window.CYOL.discrepancyInfo)).toMatchObject(expectedDiscrepancyInfo);

            await page.close();
        });

        test('when loading from save data without storedDiscrepancyInfo', async ({browser}) => {
            let page = await openCookieClickerPage(browser, {
                mockedDate: 1.6e12 + 86400 * 1000 + 1000,
            });
            await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
            await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

            let modifiedSaveGame: Partial<typeof defaultSaveGame> = structuredClone(defaultSaveGame);
            delete modifiedSaveGame.modSaveData;
            let save = CCSave.toNativeSave(CCSave.fromObject(modifiedSaveGame));
            await destroyDiscrepancyInfo(page);
            await page.evaluate(({save, discrepancy}) => {CConnoisseur.setupDiscrepancy(discrepancy); Game.LoadSave(save)}, {save, discrepancy});
            await page.waitForFunction(() => window.CYOL.discrepancyInfo.available);
            expect(await page.evaluate(() => window.CYOL.discrepancyInfo)).toMatchObject(expectedDiscrepancyInfo);

            // Do it again, this time over a page with an existing save
            await destroyDiscrepancyInfo(page);
            await page.evaluate(({save, discrepancy}) => {CConnoisseur.setupDiscrepancy(discrepancy); Game.LoadSave(save)}, {save, discrepancy});
            await page.waitForFunction(() => window.CYOL.discrepancyInfo.available);
            expect(await page.evaluate(() => window.CYOL.discrepancyInfo)).toMatchObject(expectedDiscrepancyInfo);

            await page.close();
        });
    });

    test('Is present even if no lump was harvested', async ({browser}) => {
        let page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12,
            forceDiscrepancy: 17, // Should not matter
            saveGame: defaultSaveGame,
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        expect(await page.evaluate(() => window.CYOL.discrepancyInfo)).toMatchObject({
            available: true,
            previous: {
                lumpT: 1.6e12,
                lumpOverripeAge: 86400 * 1000,
            },
            current: {
                lumpT: 1.6e12,
                lumpOverripeAge: 86400 * 1000,
            },
            expectedDiscrepancy: 1,
        });
        await page.close();
    });

    test('Is wiped on reset', async ({browser}) => {
        let page = await openCookieClickerPage(browser, {saveGame: defaultSaveGame});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        expect(await page.evaluate(() => window.CYOL.discrepancyInfo.available)).toBeTruthy();

        // Wipe save
        await page.getByText('Options', { exact: true }).click();
        await page.getByText('Wipe save').click();
        await page.getByText('Yes!').click();
        await page.getByText('Do it!').click();

        expect(await page.evaluate(() => window.CYOL.discrepancyInfo.available)).toBeFalsy();
        await page.close();
    });
});
