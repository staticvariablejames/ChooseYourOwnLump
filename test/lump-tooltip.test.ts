import { test, expect } from '@playwright/test';
import { openCookieClickerPage, setupCookieClickerPage, CCSave } from 'cookie-connoisseur';

test('Lump tooltip shows current lump type', async ({page}) => {
    page = await setupCookieClickerPage(page, {
        saveGame: {
            lumps: 0,
            lumpCurrentType: 'caramelized',
        },
    });
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    await page.locator('#lumps').hover();
    await expect(page.locator('#tooltip')).toContainText(/growing now is\s*caramelized/);
});

test.describe('Discrepancy information', () => {
    test('Says no discrepancy information if this is the case', async ({page}) => {
        page = await setupCookieClickerPage(page, {saveGame: {lumps: 0}});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        await page.locator('#lumps').hover();
        await expect(page.locator('#tooltip')).toContainText('No discrepancy information');
    });

    test('Says so if no lump was harvested', async ({browser}) => {
        let page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12,
            saveGame: {lumps:0},
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        let save = await page.evaluate(() => Game.WriteSave(1));
        await page.close();

        // Open a page 1h later
        page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12+3600*1000,
            saveGame: save,
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        await page.locator('#lumps').hover();
        await expect(page.locator('#tooltip')).toContainText('No lump was harvested offline');
        await page.close();
    });

    test('Says so if discrepancy matches the expected', async ({browser}) => {
        let page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12,
            saveGame: {
                lumps: 0,
                achievements: 'all',
                dragonLevel: 27,
                dragonAura: 17, // "Dragon's Curve"
            },
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        await page.evaluate(() => window.CYOL.preferences.discrepancy = 617);
        let save = await page.evaluate(() => Game.WriteSave(1));
        await page.close();

        // Open a page 1 day later
        page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12+86400*1000 + 1000,
            saveGame: save,
            forceDiscrepancy: 617,
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        await page.locator('#lumps').hover();
        await expect(page.locator('#tooltip')).toContainText("The discrepancy was 617ms, exactly what we expected!");
        await page.close();
    });

    test('Says so if the discrepancy error is small', async ({browser}) => {
        let page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12,
            saveGame: {
                lumps: 0,
                achievements: 'all',
                dragonLevel: 27,
                dragonAura: 18, // "Reality Bending"
                modSaveData: {
                    "Choose Your Own Lump": {
                        preferences: {
                            discrepancy: 617,
                        },
                    },
                },
            },
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        let save = await page.evaluate(() => Game.WriteSave(1));
        await page.close();

        // Open a page 1 day later
        page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12+86400*1000 + 1000,
            saveGame: save,
            forceDiscrepancy: 317,
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        await page.locator('#lumps').hover();
        await expect(page.locator('#tooltip')).toContainText("The actual discrepancy was 317ms, which differs from the expected discrepancy of 617ms");
        await page.close();
    });

    test('Says so if the discrepancy was due to unloaded pantheon', async ({browser}) => {
        // This one essentially only happens when loading from localStorage
        let page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12,
            saveGame: {
                lumps: 0,
                achievements: 'all',
                buildings: {
                    'Temple': {
                        level: 1,
                        amount: 10,
                        minigame: {
                            rubySlot: 'order',
                        },
                    },
                },
                dragonLevel: 27,
                dragonAura: 18, // "Reality Bending"
                modSaveData: {
                    "Choose Your Own Lump": {
                        preferences: {
                            discrepancy: 617,
                        },
                    },
                },
            },
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        let save = await page.evaluate(() => Game.WriteSave(1));
        await page.close();

        // Open a page 1 day later
        page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12+86400*1000 + 1000,
            saveGame: save,
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        await page.locator('#lumps').hover();
        await expect(page.locator('#tooltip')).toContainText("which differs from the expected discrepancy of 617ms");
        await expect(page.locator('#tooltip')).toContainText("Rigidel did not have an effect on lump maturation times");
        await page.close();
    });

    test('Says so if multiple lumps were autoharvested', async ({browser}) => {
        let page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12,
            saveGame: {
                lumps: 0,
            },
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        let save = await page.evaluate(() => Game.WriteSave(1));
        await page.close();

        // Open a page 2 days later
        page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12+2*86400*1000 + 1000,
            saveGame: save,
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        await page.locator('#lumps').hover();
        await expect(page.locator('#tooltip')).toContainText("More than one lump was autoharvested");
        await page.close();
    });

    test('Tells the player something went wrong if all else fails', async ({browser}) => {
        let page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12,
            saveGame: {
                achievements: 'all',
                lumps: 0,
            },
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        let save = await page.evaluate(() => Game.WriteSave(1));
        await page.close();

        // Open a page 1 day later, forcing a very high discrepancy, beyond the 1000ms threshold
        page = await openCookieClickerPage(browser, {
            mockedDate: 1.6e12+86400*1000 + 1000,
            saveGame: save,
            forceDiscrepancy: 1117,
        });
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        await page.locator('#lumps').hover();
        await expect(page.locator('#tooltip')).toContainText("Something went wrong");
        await page.close();
    });
});

test.describe('Snapshot testing (for the README.md)', () => {
    test('The lump tooltip displays a full list of predictions with grandmas', async ({page}) => {
        // adversarially-constructed-states.ts: fancy-tooltip-with-grandmas
        let calculatedLumpT = 1600002099695;
        let saveGame = CCSave.fromObject({
            seed: 'james',
            lumps: 0,
            cookies: 1e50,
            lumpT: calculatedLumpT,
            lumpCurrentType: 'caramelized',
            achievements: 'all',
            ownedUpgrades: [
                "Sugar aging process",
            ],
            dragonLevel: 27,
            dragonAura: 18, // Reality Bending
            dragonAura2: 17, // Dragon's Curve
            elderWrath: 2,
            buildings: {
                'Grandma': {
                    amount: 598,
                },
                'Temple': {
                    amount: 2,
                    level: 1,
                    minigame: {
                        diamondSlot: 'order',
                    },
                },
            },
            modSaveData: {
                "CCSE": {"showVersionNo": 0},
                "Choose Your Own Lump": {
                    preferences: {
                        /* All tests for the README use discrepancy:1,
                         * even though it does not matter for this test in particular.
                         */
                        discrepancy: 1,
                        display: {
                            rows: 8,
                        },
                        filtering: {
                            threeColumnDragonAuras: true,
                            includeType: {
                                normal: true,
                                bifurcated: true,
                                golden: true,
                                meaty: true,
                                caramelized: true,
                            },
                        },
                    },
                },
            },
        });

        page = await setupCookieClickerPage(page, {saveGame, mockedDate: calculatedLumpT});
        await page.setViewportSize({width:1024, height:1440});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        await page.evaluate(() => window.CConnoisseur.closeNotes());
        await page.locator('#lumps').hover();
        await page.waitForFunction(() => ! document.getElementById('tooltip')!.textContent!.match('recalculating'));
        let tooltipHandle = page.locator('#tooltip');
        expect(await tooltipHandle.screenshot()).toMatchSnapshot('tooltipWithGrandmas.png');
    });

    test('The lump tooltip displays a summary of predictions with grandmas', async ({page}) => {
        // adversarially-constructed-states.ts: fancy-summary-tooltip-without-grandmas
        let calculatedLumpT = 1600000000015;
        let lumpOverripeAge = 85434000;
        let saveGame = CCSave.fromObject({
            seed: 'james',
            lumps: 0,
            cookies: 1e15,
            // Need the -1 here because we will force the discrepancy to be 1
            lumpT: Math.ceil(calculatedLumpT - lumpOverripeAge) - 1,
            achievements: 'all',
            ownedUpgrades: [
                "Sugar aging process",
            ],
            elderWrath: 2,
            buildings: {
                Grandma: {
                    amount:161,
                },
            },
            modSaveData: {
                "CCSE": {"showVersionNo": 0},
                "Choose Your Own Lump": {
                    preferences: {
                        discrepancy: 1,
                        display: {
                            reportType: 'summary',
                        },
                        filtering: {
                            threeColumnDragonAuras: true,
                        },
                    },
                    storedDiscrepancyInfo: {
                        lumpT: Math.ceil(calculatedLumpT - lumpOverripeAge) - 1,
                        lumpOverripeAge,
                    },
                },
            },
        });

        page = await setupCookieClickerPage(page, {saveGame, mockedDate: calculatedLumpT, forceDiscrepancy: 1});
        await page.setViewportSize({width:1024, height:1440});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

        // Wait for the "+1 sugar lump" popup to disapear
        await page.waitForFunction(threshold => Date.now() > threshold, calculatedLumpT+5000);
        await page.evaluate(() => window.CConnoisseur.closeNotes());
        await page.evaluate(() => Game.lumpCurrentType = 2); // Small lie for the screenshot
        await page.locator('#lumps').hover();
        await page.waitForFunction(() => ! document.getElementById('tooltip')!.textContent!.match('recalculating'));
        let tooltipHandle = page.locator('#tooltip');
        expect(await tooltipHandle.screenshot()).toMatchSnapshot('tooltipSummaryWithGrandmas.png');
    });

    test('The lump tooltip displays the predictions without grandmas', async ({page}) => {
        // adversarially-constructed-states.ts: fancy-tooltip-without-grandmas
        let calculatedLumpT = 1600000424351;
        let lumpOverripeAge = 84794029.85074627;
        let saveGame = CCSave.fromObject({
            seed: 'james',
            lumps: 0,
            cookies: 1e50,
            // No -1 here because the discrepancy will be forced to be 0
            lumpT: Math.ceil(calculatedLumpT - lumpOverripeAge),
            achievements: 'all',
            dragonLevel: 27,
            dragonAura: 18, // Reality Bending
            elderWrath: 3,
            buildings: {
                'Grandma': {
                    amount: 10,
                },
                'Temple': {
                    amount: 10,
                    level: 1,
                    minigame: {
                        jadeSlot: 'order',
                    },
                },
            },
            modSaveData: {
                "CCSE": {"showVersionNo": 0},
                "Choose Your Own Lump": {
                    preferences: {
                        discrepancy: 1, // We will force the discrepancy to be 0 (to show the error message in the tooltip)
                        display: {
                            compactGrandmapocalypseRepresentation: true,
                            useMatureGoldenLumpSprite: true,
                        },
                        filtering: {
                            threeColumnDragonAuras: false,
                        },
                    },
                    storedDiscrepancyInfo: {
                        lumpT: Math.ceil(calculatedLumpT - lumpOverripeAge),
                        lumpOverripeAge,
                    },
                },
            },
        });

        page = await setupCookieClickerPage(page, {saveGame, mockedDate: calculatedLumpT+1});
        await page.setViewportSize({width:1024, height:768});
        await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
        await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
        await page.waitForFunction(() => Game.Objects['Temple'].minigameLoaded);
        await page.evaluate(save => {CConnoisseur.setupDiscrepancy(0); Game.LoadSave(save)}, CCSave.toNativeSave(saveGame));

        // Wait for the "+1 sugar lump" popup to disapear
        await page.waitForFunction(threshold => Date.now() > threshold, calculatedLumpT+5000);
        await page.evaluate(() => window.CConnoisseur.closeNotes());

        await page.locator('#lumps').hover();
        await page.waitForFunction(() => ! document.getElementById('tooltip')!.textContent!.match('recalculating'));
        let tooltipHandle = page.locator('#tooltip');
        expect(await tooltipHandle.screenshot()).toMatchSnapshot('tooltipWithoutGrandmas.png');
    });
});
