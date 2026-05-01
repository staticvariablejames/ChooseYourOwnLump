import { test, expect } from '@playwright/test';
import { openCookieClickerPage, setupCookieClickerPage } from 'cookie-connoisseur';

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
        await expect(page.locator('#tooltip')).toContainText("The discrepancy was 317ms, which differs from the expected 617ms");
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
        await expect(page.locator('#tooltip')).toContainText("which differs from the expected 617ms");
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
