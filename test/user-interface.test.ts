import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';
import { getDefaultPreferences } from '../src/preferences';

test('Changing preferences updates the CYOL.preferences object', async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    let expectedPreferences = getDefaultPreferences();
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.getByText('Options', {exact: true}).click();
    await page.getByText('Normal OFF').click();
    expectedPreferences.filtering.includeType.normal = true;
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.locator('#CYOL-slider-preserveGrandmapocalypseStage').fill('0');
    expectedPreferences.filtering.conditions.preserveGrandmapocalypseStage = 'require';
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.locator('#CYOL-slider-preservePantheon').fill('2');
    expectedPreferences.filtering.conditions.preservePantheon = 'ignore';
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.getByText('Golden ON').click();
    expectedPreferences.filtering.includeType.golden = false;
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.getByText('Caramelized ON').click();
    expectedPreferences.filtering.includeType.caramelized = false;
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.getByText('Meaty OFF').click();
    expectedPreferences.filtering.includeType.meaty = true;
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.getByText('Bifurcated OFF').click();
    expectedPreferences.filtering.includeType.bifurcated = true;
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.locator('#CYOL-slider-preserveDragon').fill('0');
    expectedPreferences.filtering.conditions.preserveDragon = 'require';
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.locator('#CYOL-slider-respectBudget').fill('2');
    expectedPreferences.filtering.conditions.respectBudget = 'ignore';
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.locator('#CYOL-slider-discrepancy').fill('3');
    expectedPreferences.discrepancy = 3;
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.locator('#CYOL-slider-rowsToDisplay').fill('15');
    expectedPreferences.display.rows = 15;
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.getByText('Filtered display OFF').click();
    expectedPreferences.display.reportType = 'filtered';
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);

    await page.getByText('Display dragon auras in three').click();
    expectedPreferences.filtering.threeColumnDragonAuras = true;
    expect(await page.evaluate(() => window.CYOL.preferences)).toEqual(expectedPreferences);
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
