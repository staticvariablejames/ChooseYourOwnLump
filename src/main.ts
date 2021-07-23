import * as CYOL from './index';
import { name, version, GameVersion, CCSEVersion } from './mod';

declare global {
    interface Window {
        CYOL: typeof CYOL;
    }
}

window.CYOL = CYOL;

if(typeof CCSE == 'undefined') Game.LoadMod('https://klattmose.github.io/CookieClicker/CCSE.js');

if(!CYOL.isLoaded){
    if(window.CCSE && window.CCSE.isLoaded){
        Game.registerMod('Choose your own lump', CYOL);
    }
    else {
        if(!window.CCSE) window.CCSE = {};
        if(!window.CCSE.postLoadHooks) window.CCSE.postLoadHooks = [];
        window.CCSE.postLoadHooks.push(function() {
            if(window.CCSE.ConfirmGameCCSEVersion(name, version, GameVersion, CCSEVersion)) {
                Game.registerMod('Choose your own lump', CYOL);
            }
        });
    }
}
