import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test('Changing settings updates the CYOL.UI.settings object', async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    let expectedSettings = {
        discrepancy: 1,
        includeNormal: false,
        includeBifurcated: false,
        includeGolden: true,
        includeMeaty: false,
        includeCaramelized: false,
        preserveGrandmapocalypseStage: false,
        preserveDragon: false,
        preservePantheon: false,
        rowsToDisplay: 10,
    }
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(expectedSettings);

    await page.getByText('Options').click();
    await page.getByText('Hiding normal lumps').click();
    expectedSettings.includeNormal = true;
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(expectedSettings);

    await page.getByText('Any grandmapocalypse stage').click();
    expectedSettings.preserveGrandmapocalypseStage = true;
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(expectedSettings);

    await page.getByText('Any pantheon configuration').click();
    expectedSettings.preservePantheon = true;
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(expectedSettings);

    await page.getByText('Showing golden lumps').click();
    expectedSettings.includeGolden = false;
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(expectedSettings);

    await page.getByText('Hiding caramelized lumps').click();
    expectedSettings.includeCaramelized = true;
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(expectedSettings);

    await page.getByText('Hiding meaty lumps').click();
    expectedSettings.includeMeaty = true;
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(expectedSettings);

    await page.locator('#CYOLdiscrepancySlider').fill('3');
    expectedSettings.discrepancy = 3;
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(expectedSettings);

    await page.locator('#CYOLrowsToDisplaySlider').fill('15');
    expectedSettings.rowsToDisplay = 15;
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(expectedSettings);
});

test('The lump tooltip displays the predictions without grandmas', async ({page}) => {
    page = await setupCookieClickerPage(page, {saveGame: {
        seed: "ufekf",
        cookies: 1e12,
        lumps: 0, // Prevents Game.doLumps() from overriding lumpCurrentType
        lumpCurrentType: 'bifurcated',
        modSaveData: {
            "CCSE": {"showVersionNo": 0}, // For the screenshot, so it does not go over the tooltip
            "Choose your own lump": {
                settings: {
                    includeMeaty: true,
                    includeCaramelized: true,
                },
            },
        },
    }});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    // The following two make the snapshot test less brittle:
    await page.waitForFunction(() => Date.now() > 16e11+1000); // Forces time till mature to be 19h59m
    await page.evaluate(() => window.CConnoisseur.closeNotes());

    await page.locator('#lumps').hover();
    let tooltipHandle = page.locator('#tooltip');
    expect(await tooltipHandle.screenshot()).toMatchSnapshot('tooltipWithoutGrandmas.png');
});

test('The lump tooltip displays the predictions with grandmas', async ({page}) => {
    page = await setupCookieClickerPage(page, {saveGame: {
        seed: "hcecu",
        cookies: 1e12,
        lumps: 0, // Prevents Game.doLumps() from overriding lumpCurrentType
        lumpCurrentType: 'bifurcated',
        ownedUpgrades: [
            "Sugar aging process",
        ],
        modSaveData: {
            "CCSE": {"showVersionNo": 0},
            "Choose your own lump": {
                settings: {
                    rowsToDisplay: 8,
                },
            },
        },
    }});
    await page.setViewportSize({ width: 1920, height: 1050 }); // for the screenshot
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
    await page.waitForFunction(() => Date.now() > 16e11+1000);
    await page.evaluate(() => window.CConnoisseur.closeNotes());

    await page.hover('#lumps');
    let tooltipHandle = page.locator('#tooltip');
    expect(await tooltipHandle.screenshot()).toMatchSnapshot('tooltipWithGrandmas.png');
});
