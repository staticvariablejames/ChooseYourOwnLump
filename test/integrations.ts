// Tests integration with other mods.

///<reference path="../src/types.d.ts" />
import { CCPageOptions, openCookieClickerPage } from 'cookie-connoisseur';
import { Browser } from 'playwright';
import * as CYOL from '../src/index';

export const integrations = (getBrowser: () => Browser) => {

let newPage = (options: CCPageOptions = {}) => openCookieClickerPage(getBrowser(), options);

test('Recognizes Spiced Cookies\' discrepancy patch', async () => {
    let page = await newPage();
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));

    // Everything should work if Spiced Cookies is absent
    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);
    let effectiveDiscrepancy = await page.evaluate(() => CYOL.UI.effectiveDiscrepancy());
    expect(effectiveDiscrepancy).toEqual(1);

    // No action taken if Spiced Cookies' setting is disabled
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => typeof Spice == "object" && Spice.isLoaded);
    effectiveDiscrepancy = await page.evaluate(() => CYOL.UI.effectiveDiscrepancy());
    expect(effectiveDiscrepancy).toEqual(1);

    // Action should be taken if the setting is enabled
    await page.click('text=Options');
    await page.click('text=Don\'t patch lump times computation');
    effectiveDiscrepancy = await page.evaluate(() => CYOL.UI.effectiveDiscrepancy());
    expect(effectiveDiscrepancy).toEqual(0);

    await page.close();
});

};
