import { CCPageOptions, openCookieClickerPage } from 'cookie-connoisseur';
import { Browser } from 'playwright';

export const userInterface = (getBrowser: () => Browser) => {

let newPage = (options: CCPageOptions = {}) => openCookieClickerPage(getBrowser(), options);

test('Changing settings updates the CYOL.UI.settings object', async () => {
    let page = await newPage();
    await page.evaluate("Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js')");
    await page.waitForFunction('typeof CYOL == "object" && CYOL.isLoaded;');

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
    expect(await page.evaluate('CYOL.UI.settings')).toEqual(actualSettings);

    await page.click('text=Options');
    await page.click('text=Hiding normal lumps');
    actualSettings.includeNormal = true;
    expect(await page.evaluate('CYOL.UI.settings')).toEqual(actualSettings);

    await page.click('text=Any grandmapocalypse stage');
    actualSettings.preserveGrandmapocalypseStage = true;
    expect(await page.evaluate('CYOL.UI.settings')).toEqual(actualSettings);

    await page.click('text=Any pantheon configuration');
    actualSettings.preservePantheon = true;
    expect(await page.evaluate('CYOL.UI.settings')).toEqual(actualSettings);

    await page.click('text=Showing golden lumps');
    actualSettings.includeGolden = false;
    expect(await page.evaluate('CYOL.UI.settings')).toEqual(actualSettings);

    await page.click('text=Hiding caramelized lumps');
    actualSettings.includeCaramelized = true;
    expect(await page.evaluate('CYOL.UI.settings')).toEqual(actualSettings);

    await page.click('text=Hiding meaty lumps');
    actualSettings.includeMeaty = true;
    expect(await page.evaluate('CYOL.UI.settings')).toEqual(actualSettings);

    expect(await page.$eval('#CYOLdiscrepancySlider', e => {
        if(!(e instanceof HTMLInputElement)) return false;
        e.value = "3";
        e.dispatchEvent(new Event('input'));
        e.dispatchEvent(new Event('change'));
        return true;
    })).toBe(true);
    actualSettings.discrepancy = 3;
    expect(await page.evaluate('CYOL.UI.settings')).toEqual(actualSettings);

    expect(await page.$eval('#CYOLrowsToDisplaySlider', e => {
        if(!(e instanceof HTMLInputElement)) return false;
        e.value = "15";
        e.dispatchEvent(new Event('input'));
        e.dispatchEvent(new Event('change'));
        return true;
    })).toBe(true);
    actualSettings.rowsToDisplay = 15;
    expect(await page.evaluate('CYOL.UI.settings')).toEqual(actualSettings);

    await page.close();
});

};
