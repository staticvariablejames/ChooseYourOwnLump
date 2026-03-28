import { test, expect } from '@playwright/test';
import { openCookieClickerPage, setupCookieClickerPage } from 'cookie-connoisseur';

test('Can write and read save games', async ({browser}) => {
    let page = await openCookieClickerPage(browser);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    let actualSettings = {
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

    let save1 = await page.evaluate(() => Game.WriteSave(1));
    await page.getByText('Options').click();
    await page.getByText('Hiding normal lumps').click()
    await page.getByText('Any grandmapocalypse stage').click();

    // Check it overrides the current settings
    let save2 = await page.evaluate(() => Game.WriteSave(1));
    await page.evaluate((save: string) => Game.LoadSave(save), save1);
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(actualSettings);

    // Check the old settings were preserved in save2
    actualSettings.includeNormal = true;
    actualSettings.preserveGrandmapocalypseStage = true;
    await page.evaluate((save: string) => Game.LoadSave(save), save2);
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(actualSettings);

    // Check that changing the sliders also work
    await page.locator('#CYOLdiscrepancySlider').fill('3');
    let save3 = await page.evaluate(() => Game.WriteSave(1));
    await page.evaluate((save: string) => Game.LoadSave(save), save2);
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(actualSettings);

    actualSettings.discrepancy = 3;
    await page.evaluate((save: string) => Game.LoadSave(save), save3);
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(actualSettings);

    await page.close();

    // Check that everything still works in a brand new page
    page = await openCookieClickerPage(browser);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
    await page.evaluate((save: string) => Game.LoadSave(save), save3);
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(actualSettings);
    await page.close();
});

test('Can load a save game from Web Storage', async ({page}) => {
    let actualSettings = {
        discrepancy: 3,
        includeNormal: true,
        includeBifurcated: false,
        includeGolden: true,
        includeMeaty: false,
        includeCaramelized: false,
        preserveGrandmapocalypseStage: false,
        preserveDragon: true,
        preservePantheon: false,
        rowsToDisplay: 10,
    }

    page = await setupCookieClickerPage(page, {saveGame: {
        modSaveData: {
            "Choose your own lump": {
                version: "1.3.2",
                settings: actualSettings,
            },
        },
    }});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(actualSettings);
});

test('Can load saves from previous versions', async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    let save = 'Mi4wMzF8fDE2MDAwMDAwMDAwMDA7MTYwMDAwMDAwMDAwMDsxNjAwMDAwMDAwMD'
              +'AwO01jU2xvdGg7eXprd3N8MTExMTExMDExMDAxMDAxMDAxMDEwfDA7MDswOzA7'
              +'MDswOzA7MDswOzA7MDswOzA7MDswOzA7MDswOzA7MDswOzA7OzA7MDswOzA7MD'
              +'swOzA7LTE7LTE7LTE7LTE7LTE7MDswOzA7MDs1MDswOzA7LTE7LTE7MTYwMDAw'
              +'MDAwMDAwMDswOzA7OzQxOzA7MDswO3wwLDAsMCwwLCwwLDAsMDswLDAsMCwwLC'
              +'wwLDA7MCwwLDAsMCwsMCwwOzAsMCwwLDAsLDAsMDswLDAsMCwwLCwwLDA7MCww'
              +'LDAsMCwsMCwwOzAsMCwwLDAsLDAsMDswLDAsMCwwLCwwLDA7MCwwLDAsMCwsMC'
              +'wwOzAsMCwwLDAsLDAsMDswLDAsMCwwLCwwLDA7MCwwLDAsMCwsMCwwOzAsMCww'
              +'LDAsLDAsMDswLDAsMCwwLCwwLDA7MCwwLDAsMCwsMCwwOzAsMCwwLDAsLDAsMD'
              +'swLDAsMCwwLCwwLDA7MCwwLDAsMCwsMCwwO3ww'
              +'MDAw'.repeat(485) + 'MDB8' + 'MDAw'.repeat(179) // makeshift RLE
              +'MHx8Q2hvb3NlIHlvdXIgb3duIGx1bXA6eyJkaXNjcmVwYW5jeSI6IjIiLCJpbm'
              +'NsdWRlTm9ybWFsIjpmYWxzZSwiaW5jbHVkZUJpZnVyY2F0ZWQiOnRydWUsImlu'
              +'Y2x1ZGVHb2xkZW4iOmZhbHNlLCJpbmNsdWRlQ2FyYW1lbGl6ZWQiOnRydWUsIn'
              +'ByZXNlcnZlR3JhbmRtYXBvY2FseXBzZVN0YWdlIjp0cnVlLCJwcmVzZXJ2ZURy'
              +'YWdvbiI6ZmFsc2UsInByZXNlcnZlUGFudGhlb24iOnRydWUsInJvd3NUb0Rpc3'
              +'BsYXkiOiI0IiwiaW5jbHVkZU1lYXR5Ijp0cnVlfTs%3D%21END%21';

    let actualSettings = {
        discrepancy: 2,
        includeNormal: false,
        includeBifurcated: true,
        includeGolden: false,
        includeMeaty: true,
        includeCaramelized: true,
        preserveGrandmapocalypseStage: true,
        preserveDragon: false,
        preservePantheon: true,
        rowsToDisplay: 4,
    }

    await page.evaluate((save: string) => Game.LoadSave(save), save);
    expect(await page.evaluate(() => window.CYOL.UI.settings)).toEqual(actualSettings);
});
