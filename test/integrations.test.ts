// Tests integration with other mods.

import { test, expect } from '@playwright/test';
import { openCookieClickerPage } from 'cookie-connoisseur';

test('Recognizes Spiced Cookies\' discrepancy patch', async ({browser}) => {
    let page = await openCookieClickerPage(browser);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));

    // Everything should work if Spiced Cookies is absent
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
    let effectiveDiscrepancy = await page.evaluate(() => window.CYOL.UI.effectiveDiscrepancy());
    expect(effectiveDiscrepancy).toEqual(1);

    // No action taken if Spiced Cookies' setting is disabled
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/SpicedCookies/Spice.js'));
    await page.waitForFunction(() => typeof Spice == "object" && Spice.isLoaded);
    effectiveDiscrepancy = await page.evaluate(() => window.CYOL.UI.effectiveDiscrepancy());
    expect(effectiveDiscrepancy).toEqual(1);

    // Action should be taken if the setting is enabled
    await page.click('text=Options');
    await page.click('text=Don\'t patch lump times computation');
    effectiveDiscrepancy = await page.evaluate(() => window.CYOL.UI.effectiveDiscrepancy());
    expect(effectiveDiscrepancy).toEqual(0);

    await page.close();
});
