import { PlannerCore } from '../src/planner/core';
import { chromium as myBrowser } from 'playwright';
import { openCookieClickerPage } from 'cookie-connoisseur';

setTimeout(async () => {
    let browser = await myBrowser.launch({headless: false});
    let page = await openCookieClickerPage(browser);
    await page.evaluate("Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/dist/main.js')");
    console.log(await page.evaluate(() => Game.lumpT));
    console.log(new PlannerCore({}).currentPrediction());
    await page.pause();
    await page.close();
    await browser.close();
});
