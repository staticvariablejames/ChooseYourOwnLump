# Changelog

## Unreleased
- Changed: Update to Cookie Clicker 2.058, CCSE 2.035.
- Changed: The changelog now lives in its own file, rather than in `README.md`.
- **Removed**: legacy support for loading CYOL saves from versions 1.2.7 and earlier.
    (CYOL 1.3.2 has been around for 4.5 years,
    nobody should be using any other version.)
- **Removed**: compatibility with Spiced Cookies.
    It will be re-added in a future update.
- (internal) Changed: the mod ID to "Choose Your Own Lump" (with capital letters).
    The mod retrieves data from the old ID "Choose your own lump",
    so players should not notice this change.
- (internal) Changed: the bundler to Vite,
    due to its native support to web workers.

## 1.3.2 - 2021-09-08
- Changed: Update to CCSE 2.026.
- Changed: The mod won't check the CCSE version anymore.
    (Reasoning: currently CCSE updates far more frequently that Choose Your Own Lump,
    and usually in a backwards-compatible manner.
    Not asking CCSE version every time makes the mod a bit more future-proof.)

## 1.3.1 - 2021-09-02
- Changed: Update to CCSE 2.025.

## 1.3.0 - 2021-07-29
- Fixed: The setting to search for meaty lumps was not being saved.
- (internal) Added: more robust test suite.
- (internal) Changed: Many internal changes,
    most prominently, porting the mod to TypeScript.

## 1.2.7 - 2021-03-27
- Changed: Update to CCSE 2.023.

## 1.2.6 - 2020-12-01
- Added: notification on load.
- Changed: Update to CCSE 2.021.

## 1.2.5 - 2020-11-06
- Added: Compatibility with [Spiced Cookies' discrepancy patch](https://github.com/staticvariablejames/SpicedCookies##discrepancy-patch-disabled-by-default).

## 1.2.4 - 2020-11-05
- Changed: Minor tooltip improvement
    (the current lump type also has an icon now).

## 1.2.3 - 2020-11-02
- Added: Register the mod in the modding API and use it for storing the settings.

## 1.2.2 - 2020-11-01
- Changed: Update to Cookie Clicker v2.031.

## 1.2.1 - 2020-10-07
- Changed: Use CCSE v2.018.

## 1.2.0 - 2020-09-27
- Added: option to only show predictions matching the current grandmapocalypse stage,
    the current dragon auras,
    and the current pantheon configuration.

## 1.1.5 - 2020-09-21
- Added: Display version number in the stats menu.

## 1.1.4 - 2020-09-11
- Fixed: nasty bug when loading settings.
    (Sometimes `CYOL.UI.settings.discrepancy` was being loaded as a string,
    resulting in wrong predictions
    due to Javascript silently performing string concatenation where it should add two numbers.)

    Thanks to [`u/cookieliker`](https://www.reddit.com/user/cookieliker)
    and [`u/GLucky88`](https://www.reddit.com/user/GLucky88/) for the bug report!

## 1.1.3 - 2020-08-29
- Removed: code injection to `Game.lumpTooltip` that showed the lump type,
    as this information is already shown together with the discrepancy.

## 1.1.2 - 2020-08-27
- Added: Warn the player if the Pantheon was not loaded when the lump type was being computed.

## 1.1.1 - 2020-08-27
- Fixed: visual bug regarding the display of the discrepancy.

## 1.1.0 - 2020-08-26
- Added: Released under GPLv3 or later.

    Technically the minor version number should have been increased a few patch versions ago,
    since more functionality was added
    (significantly improved displaying of states and displaying the discrepancy).

## 1.0.5 - 2020-08-26
- Added: The discrepancy is now displayed in the lump tooltip.

## 1.0.4 - 2020-08-24
- Changed: Minor UI improvements.

## 1.0.3 - 2020-08-24
- Changed: Update to Cookie Clicker 2.029, CCSE 2.017.

## 1.0.2 - 2020-08-24
- Changed: States that differ only in the grandmapocalypse stage are now shown together.

    More than half of the time all four stages of the grandmapocalypse yield the same lump.
    This should help declutter the display screen.
    However,
    to display everything,
    I made the sugar lump tooltip wider in a kludgey manner;
    this might cause incompatibilities if any other mod messes with that tooltip.

## 1.0.1 - 2020-08-18
- Changed: Functionally equivalent states are no longer generated multiple times;
    for example,
    instead of generating a state with 500 grandmas and Rigidel on the ruby slot
    and another state with 300 grandmas and Rigidel on the diamond slot,
    only the former one is generated.

## 1.0.0 - 2020-08-16
- Added: initial release.
