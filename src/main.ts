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
    let id = 'Choose your own lump';
    if(window.CCSE && window.CCSE.isLoaded){
        Game.registerMod(id, CYOL);
    }
    else {
        if(!window.CCSE) window.CCSE = ({} as (typeof CCSE));
        if(!window.CCSE.postLoadHooks) window.CCSE.postLoadHooks = [];
        window.CCSE.postLoadHooks.push(function() {
            if(window.CCSE.ConfirmGameCCSEVersion(name, version, GameVersion, CCSEVersion)) {
                Game.registerMod(id, CYOL);
            }
        });
    }
}
