import { test, expect } from '@playwright/test';
import { openCookieClickerPage } from 'cookie-connoisseur';
import { html as beautify_html } from 'js-beautify';
import * as CYOL from '../src/index';

test('Changing settings updates the CYOL.UI.settings object', async ({browser}) => {
    let page = await openCookieClickerPage(browser);
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
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.click('text=Options');
    await page.click('text=Hiding normal lumps');
    actualSettings.includeNormal = true;
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.click('text=Any grandmapocalypse stage');
    actualSettings.preserveGrandmapocalypseStage = true;
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.click('text=Any pantheon configuration');
    actualSettings.preservePantheon = true;
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.click('text=Showing golden lumps');
    actualSettings.includeGolden = false;
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.click('text=Hiding caramelized lumps');
    actualSettings.includeCaramelized = true;
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.click('text=Hiding meaty lumps');
    actualSettings.includeMeaty = true;
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    expect(await page.$eval('#CYOLdiscrepancySlider', e => {
        if(!(e instanceof HTMLInputElement)) return false;
        e.value = "3";
        e.dispatchEvent(new Event('input'));
        e.dispatchEvent(new Event('change'));
        return true;
    })).toBe(true);
    actualSettings.discrepancy = 3;
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    expect(await page.$eval('#CYOLrowsToDisplaySlider', e => {
        if(!(e instanceof HTMLInputElement)) return false;
        e.value = "15";
        e.dispatchEvent(new Event('input'));
        e.dispatchEvent(new Event('change'));
        return true;
    })).toBe(true);
    actualSettings.rowsToDisplay = 15;
    expect(await page.evaluate(() => CYOL.UI.settings)).toEqual(actualSettings);

    await page.close();
});

test('The lump tooltip displays the predictions without grandmas', async ({browser}) => {
    let page = await openCookieClickerPage(browser,);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);
    await page.evaluate(() => Game.seed = "ufekf");
    await page.evaluate(() => Game.Earn(1e12));
    await page.waitForFunction(() => Game.lumpsTotal != -1);
    await page.evaluate(() => Game.lumpT = 16e11);
    await page.evaluate(() => CYOL.UI.settings.includeMeaty = true);
    await page.evaluate(() => CYOL.UI.settings.includeCaramelized = true);

    // The following two make the snapshot test less brittle:
    await page.evaluate(() => Game.lumpCurrentType = 1); // Makes the lump not depend on time
    await page.waitForFunction(() => Date.now() > 16e11+1000); // Forces time till mature to be 19h59m

    await page.hover('#lumps');
    let tooltipHtml = await page.evaluate(() => document.getElementById("tooltip")!.outerHTML);
    expect(beautify_html(tooltipHtml)).toMatchSnapshot('tooltip-without-grandmas.txt');

    if(process.env.UPDATE_SCREENSHOTS) {
        const tooltipHandle = await page.$('#tooltip');
        await tooltipHandle!.screenshot({ path: 'doc/tooltip-without-grandmas.png' });
    }

    await page.close();
});

test('The lump tooltip displays the predictions with grandmas', async ({browser}) => {
    let page = await openCookieClickerPage(browser);
    await page.setViewportSize({ width: 1920, height: 1050 }); // for the screenshot
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);
    await page.evaluate(() => Game.seed = "hcecu");
    await page.evaluate(() => Game.Earn(1e12));
    await page.waitForFunction(() => Game.lumpsTotal != -1);
    await page.evaluate(() => Game.lumpT = 16e11);
    await page.evaluate(() => Game.Upgrades["Sugar aging process"].earn());
    await page.evaluate(() => Game.lumpCurrentType = 1);
    await page.evaluate(() => CYOL.UI.settings.rowsToDisplay = 8);
    await page.waitForFunction(() => Date.now() > 16e11+1000);

    await page.hover('#lumps');
    let tooltipHtml = await page.evaluate(() => document.getElementById("tooltip")!.outerHTML);
    expect(beautify_html(tooltipHtml)).toMatchSnapshot('tooltip-with-grandmas.txt');

    if(process.env.UPDATE_SCREENSHOTS) {
        const tooltipHandle = await page.$('#tooltip');
        await tooltipHandle!.screenshot({ path: 'doc/tooltip-with-grandmas.png' });
    }

    await page.close();
});
