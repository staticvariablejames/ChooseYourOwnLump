import { test, expect } from '@playwright/test';
import { setupCookieClickerPage } from 'cookie-connoisseur';

test('Persistent state is retrieved correctly', async ({page}) => {
    page = await setupCookieClickerPage(page, {saveGame: {
        seed: "ufekf",
        cookies: 1e12,
        lumps: 0,
        lumpT: 1.6e12,
    }});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
    let currentPersistentState = await page.evaluate(() => window.CYOL.PersistentState.current());
    expect(currentPersistentState).toEqual({
        seed: 'ufekf',
        lumpT: 16e11,
        hasSteviaCaelestis: false,
        hasSucralosiaInutilis: false,
        hasSugarAgingProcess: false,
    });

    await page.evaluate(() => Game.Upgrades['Stevia Caelestis'].earn());
    await page.evaluate(() => Game.lumpT += 1000);
    currentPersistentState = await page.evaluate(() => window.CYOL.PersistentState.current());
    expect(currentPersistentState).toEqual({
        seed: 'ufekf',
        lumpT: 1.6e12+1000,
        hasSteviaCaelestis: true,
        hasSucralosiaInutilis: false,
        hasSugarAgingProcess: false,
    });
});

test('Transient state is retrieved correctly', async ({page}) => {
    page = await setupCookieClickerPage(page, {saveGame: {
            cookies: 1e12,
    }});
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);
    let currentTransientState = await page.evaluate(() => window.CYOL.TransientState.current());
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
    currentTransientState = await page.evaluate(() => window.CYOL.TransientState.current());
    expect(currentTransientState).toEqual({
        dragon: {
            hasDragonsCurve: false,
            hasRealityBending: false,
        },
        grandmaCount: 5,
        grandmapocalypseStage: 0,
        rigidelSlot: 0,
    });
});

test('Lump types are predicted correctly', async ({page}) => {
    page = await setupCookieClickerPage(page);
    await page.evaluate(() => Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js'));
    await page.waitForFunction(() => typeof window.CYOL == "object" && window.CYOL.isLoaded);

    let prediction = await page.evaluate(() => new window.CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new window.CYOL.TransientState(0, window.CYOL.DragonAuras.neitherAuras, 0, 0), 0));
    expect(prediction).toEqual('normal');

    prediction = await page.evaluate(() => new window.CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new window.CYOL.TransientState(0, window.CYOL.DragonAuras.neitherAuras, 0, 0), 1));
    expect(prediction).toEqual('caramelized');

    prediction = await page.evaluate(() => new window.CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new window.CYOL.TransientState(0, window.CYOL.DragonAuras.onlyRealityBending, 1, 1), 1));
    expect(prediction).toEqual('normal');

    prediction = await page.evaluate(() => new window.CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new window.CYOL.TransientState(1, window.CYOL.DragonAuras.onlyRealityBending, 1, 1), 1));
    expect(prediction).toEqual('meaty');

    prediction = await page.evaluate(() => new window.CYOL.PersistentState(
        'ufekf', 16e11, false, false, false
    ).predictLumpType(new window.CYOL.TransientState(2, window.CYOL.DragonAuras.onlyRealityBending, 1, 1), 1));
    expect(prediction).toEqual('meaty');
});
