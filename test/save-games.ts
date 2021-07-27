import { CCPageOptions, openCookieClickerPage } from 'cookie-connoisseur';
import { Browser } from 'playwright';
import * as CYOL from '../src/index';

export const saveGames = (getBrowser: () => Browser) => {

let newPage = (options: CCPageOptions = {}) => openCookieClickerPage(getBrowser(), options);

test('Can write and read save games', async () => {
    let page = await newPage();
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);

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
    await page.click('text=Options');
    await page.click('text=Hiding normal lumps');
    await page.click('text=Any grandmapocalypse stage');

    // Check it overrides the current settings
    let save2 = await page.evaluate(() => Game.WriteSave(1));
    await page.evaluate((save: string) => Game.LoadSave(save), save1);
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    // Check the old settings were preserved in save2
    actualSettings.includeNormal = true;
    actualSettings.preserveGrandmapocalypseStage = true;
    await page.evaluate((save: string) => Game.LoadSave(save), save2);
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    // Check that changing the sliders also work
    expect(await page.$eval('#CYOLdiscrepancySlider', e => {
        if(!(e instanceof HTMLInputElement)) return false;
        e.value = "3";
        e.dispatchEvent(new Event('input'));
        e.dispatchEvent(new Event('change'));
        return true;
    })).toBe(true);
    let save3 = await page.evaluate(() => Game.WriteSave(1));
    await page.evaluate((save: string) => Game.LoadSave(save), save2);
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    actualSettings.discrepancy = 3;
    await page.evaluate((save: string) => Game.LoadSave(save), save3);
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.close();

    // Check that everything still works in a brand new page
    page = await newPage();
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);
    await page.evaluate((save: string) => Game.LoadSave(save), save3);
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);
    await page.close();
});

test('Can load a save game from Web Storage', async () => {
    // First, fabricate the save game
    let page = await newPage();
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);

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

    await page.evaluate(() => CYOL.UI.settings.discrepancy = 3);
    await page.evaluate(() => CYOL.UI.settings.includeNormal = true);
    await page.evaluate(() => CYOL.UI.settings.preserveDragon = true);
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);
    let save = await page.evaluate(() => Game.WriteSave(1));
    await page.close();

    // Now create new page with existing save file
    page = await newPage({saveGame: save as string});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);

    // Finally, test whether it worked or not
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.close();
});

test('Can load saves from previous versions', async () => {
    let page = await newPage();
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);

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
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.close();
});

};
