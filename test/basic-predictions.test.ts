import { test, expect } from '@playwright/test';
import { openCookieClickerPage } from 'cookie-connoisseur';
import * as CYOL from '../src/index';

test('Persistent state is retrieved correctly', async ({browser}) => {
    let page = await openCookieClickerPage(browser);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.evaluate(() => Game.seed = "ufekf");
    await page.evaluate(() => Game.Earn(1e12));
    await page.waitForFunction(() => Game.lumpsTotal != -1);
    await page.evaluate(() => Game.lumpT = 16e11);

    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);
    let currentPersistentState = await page.evaluate(() => CYOL.PersistentState.current());
    expect(currentPersistentState).toEqual({
        seed: 'ufekf',
        lumpT: 16e11,
        hasSteviaCaelestis: false,
        hasSucralosiaInutilis: false,
        hasSugarAgingProcess: false,
    });

    await page.evaluate(() => Game.Upgrades['Stevia Caelestis'].earn());
    await page.evaluate(() => Game.lumpT += 1000);
    currentPersistentState = await page.evaluate(() => CYOL.PersistentState.current());
    expect(currentPersistentState).toEqual({
        seed: 'ufekf',
        lumpT: 16e11+1000,
        hasSteviaCaelestis: true,
        hasSucralosiaInutilis: false,
        hasSugarAgingProcess: false,
    });

    await page.close();
});

test('Transient state is retrieved correctly', async ({browser}) => {
    let page = await openCookieClickerPage(browser);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.evaluate(() => Game.Earn(1e12));

    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);
    let currentTransientState = await page.evaluate(() => CYOL.TransientState.current());
    expect(currentTransientState).toEqual({
        dragon: {
            hasDragonsCurve: false,
            hasRealityBending: false,
        },
        grandmaCount: 0,
        grandmapocalypseStage: 0,
        rigidelSlot: 0,
    });

    await page.evaluate(() => Game.Objects["Grandma"].getFree(5));
    currentTransientState = await page.evaluate(() => CYOL.TransientState.current());
    expect(currentTransientState).toEqual({
        dragon: {
            hasDragonsCurve: false,
            hasRealityBending: false,
        },
        grandmaCount: 5,
        grandmapocalypseStage: 0,
        rigidelSlot: 0,
    });
    await page.close();
});

test('Lump types are predicted correctly', async ({browser}) => {
    let page = await openCookieClickerPage(browser);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof CYOL == "object" && CYOL.isLoaded);

    let prediction = await page.evaluate(() => new CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new CYOL.TransientState(0, CYOL.DragonAuras.neitherAuras, 0, 0), 0));
    expect(prediction).toEqual('normal');

    prediction = await page.evaluate(() => new CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new CYOL.TransientState(0, CYOL.DragonAuras.neitherAuras, 0, 0), 1));
    expect(prediction).toEqual('caramelized');

    prediction = await page.evaluate(() => new CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new CYOL.TransientState(0, CYOL.DragonAuras.onlyRealityBending, 1, 1), 1));
    expect(prediction).toEqual('normal');

    prediction = await page.evaluate(() => new CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new CYOL.TransientState(1, CYOL.DragonAuras.onlyRealityBending, 1, 1), 1));
    expect(prediction).toEqual('meaty');

    prediction = await page.evaluate(() => new CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new CYOL.TransientState(2, CYOL.DragonAuras.onlyRealityBending, 1, 1), 1));
    expect(prediction).toEqual('meaty');

    await page.close();
});
