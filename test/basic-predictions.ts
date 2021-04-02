import { CCPageOptions, openCookieClickerPage } from 'cookie-connoisseur';
import { Browser } from 'playwright';

export const basicPredictions = (getBrowser: () => Browser) => {

let newPage = (options: CCPageOptions = {}) => openCookieClickerPage(getBrowser(), options);

test('Persistent state is retrieved correctly', async () => {
    let page = await newPage();
    await page.evaluate("Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js')");
    await page.evaluate('Game.seed = "ufekf"');
    await page.evaluate('Game.Earn(1e12)');
    await page.waitForFunction('Game.lumpsTotal != -1');
    await page.evaluate('Game.lumpT = 16e11;');

    await page.waitForFunction('typeof CYOL == "object" && CYOL.isLoaded;');
    let currentPersistentState = await page.evaluate('CYOL.PersistentState.current();');
    expect(currentPersistentState).toEqual({
        seed: 'ufekf',
        lumpT: 16e11,
        hasSteviaCaelestis: 0,
        hasSucralosiaInutilis: 0,
        hasSugarAgingProcess: 0,
    });

    await page.evaluate("Game.Upgrades['Stevia Caelestis'].earn()");
    await page.evaluate("Game.lumpT += 1000");
    currentPersistentState = await page.evaluate('CYOL.PersistentState.current();');
    expect(currentPersistentState).toEqual({
        seed: 'ufekf',
        lumpT: 16e11+1000,
        hasSteviaCaelestis: 1,
        hasSucralosiaInutilis: 0,
        hasSugarAgingProcess: 0,
    });

    await page.close();
});

test('Transient state is retrieved correctly', async () => {
    let page = await newPage();
    await page.evaluate("Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js')");
    await page.evaluate('Game.Earn(1e12)');

    await page.waitForFunction('CYOL && CYOL.isLoaded;');
    let currentTransientState = await page.evaluate('CYOL.TransientState.current();');
    expect(currentTransientState).toEqual({
        dragon: {
            hasDragonsCurve: false,
            hasRealityBending: false,
        },
        grandmaCount: 0,
        grandmapocalypseStage: 0,
        rigidelSlot: 0,
    });

    await page.evaluate('Game.Objects["Grandma"].getFree(5)');
    currentTransientState = await page.evaluate('CYOL.TransientState.current();');
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

};
