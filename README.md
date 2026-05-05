Choose Your Own Lump!
=====================

**[Changelog](CHANGELOG.md)
| [Theory](#theory)
| [Practice](#practice)
| [Using the mod](#using-the-mod)**

This mod for [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/).
is a lump planner.
It tells you how to set up your game
so that the next sugar lump has the type of your choice.


Getting Started (aka TL;DR)
===========================

1.  The number of grandmas,
    the stage of the grandmapocalypse,
    the slot that Rigidel is being worshipped,
    and the auras of the dragon
    can all be used to indirectly manipulate the type of the next coalescing sugar lump.

2.  This mod tries all possibilities and tells you which ones give the desired lump types.
    Look at the pictures below and try to understand what the mod is telling you;
    this information is available in the lump tooltip.

3.  Add the mod to your game following the [instructions below](#using-the-mod),
    choose your lump type and adjust your grandmas, dragon etc. accordingly,
    **export your save**,
    wait for the lump to be auto-harvested,
    and then load your save game again.
    If everything went alright the type of your next lump is the one you choose!

4.  The most common issue is the discrepancy.
    This is a bug that makes the game miss the auto-harvest time,
    typically by one or two milliseconds.
    Reload your save game until the actual discrepancy matches the expected discrepancy;
    the lump tooltip will provide instructions as needed.


Theory
======

Introduction
------------

_Coalescing sugar lumps_
are the sugar lumps that generate roughly once a day
right under the "Stats" button.
They show up once you bake a billion cookies.
There are five types of sugar lumps:
normal, bifurcated, golden, meaty, and caramelized.
After the current sugar lump is harvested,
the next sugar lump starts growing.

The type of the next sugar lump is randomly determined as soon as the previous one is harvested,
although their appearance only starts differing after 43% of its growth has happened.
The key here is that the seed used to determine the next lump type
depends only on the game's random seed
and the time that the lump started growing.
Thus we can look at all the possibilities of time for the "birth" of the lump,
to figure out which ones gives the lump types we want.

Randomness and Planners
-----------------------

[Pseudorandom Number Generators (PRNGs)](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
are algorithms that generate a sequence of numbers that "look random".
Each PRNG has an internal state and an algorithm for updating it.
The initial state is the **seed** of the PRNG.
Whenever we ask a new number from the PRNG,
it generates one number according to its internal state,
hands it to us,
and update its internal state.
The key point is that both the generation and the update are completely deterministic:
if we know the algorithm and the internal state,
we can calculate the exact sequence of numbers produced by the PRNG.

Software that requires random numbers (like videogames)
almost always use PRNGs to get their random numbers.
In colloquial use we often call them just "RNG", because
[_true_ random number generators](https://en.wikipedia.org/wiki/Hardware_random_number_generator)
are rare.
The PRNG algorithm is usually known, but the internal state is not,
which makes them unpredictable enough for the vast majority of cases.

The deterministic nature of PRNGs gives rise to another way of using them:
"repeatable random numbers".
Cookie Clicker has many of those;
for example,
the outcome of spells from the Grimoire is decided this way.
The game takes its internal seed
(a random string of five letters, which is stored in the save file)
and the number of spells cast so far,
and use them to assemble the seed for a PRNG.
Then it uses this PRNG to essentially generate dice rolls which determine the outcome of the spell.

(It is a bit heavy-handed to use an entire PRNG just to generate a single spell outcome,
but the alternative of using a single PRNG to generate the entire sequence of spells
means that we cannot "start the sequence in the middle";
i.e. if we want to generate the 1000th number in the sequence,
we first have to generate the other 999.)

Because PRNGs are "complicated algorithms" (in a mathematically precise way),
the outcomes of grimoire spells will look unpredictable.
But because PRNGs are fully deterministic,
if we load the save from before casting the spell,
Cookie Clicker will assemble a PRNG that is identical to the one used before,
which will yield the same result.
As a consequence, we cannot savescum to try for a different spell outcome,
it will always be the same.

On the other hand,
if we know the internal game seed and the number of spells cast,
we can construct the same PRNG ourselves
and see what outcomes it's "dice rolls" (generated numbers) are.
We know how Cookie Clicker uses these random numbers to determine the next spell outcome,
so we can calculate this outcome ourselves,
which "predicts the future" in a sense.
This is the foundation of all Cookie Clicker planners.

Choose Your Own Lump is a lump planner.
The type of the next coalescing sugar lump is also a "repeatable random number",
and the seed is constructed from the internal game seed
and the time that the lump has started growing.
(This time is the number of milliseconds since January 1st, 1970,
a date known as "the Unix epoch".)
Since we know when the next lump will start growing,
we can calculate which type it will have.

The Savescumming Method
-----------------------

There are only two ways of harvesting a sugar lump:
letting it fall (auto-harvest), both online and offline,
and manually harvesting the lump by clicking on it.
Choose Your Own Lump relies on the former;
for completeness, this section discusses the latter.

Trying to find an "ideal millisecond" to harvest the lump is not viable.
Even if we knew the exact millisecond we had to click,
you are not fast enough to click on that millisecond
(this timeframe is at least half an order of magnitude faster than the refresh rate
of even high-refresh rate monitors),
so you'd need to use an autoclicker of sorts to time this click,
and good luck synchronizing the two processes with sub-millisecond precision.

So we could do trial and error.
Click on the lump to harvest it,
and check if the lump is of the desired type.
If it is not, we reload the save and try again.
There are mods who automate this sort of savescumming
(for example <https://github.com/sky-noname/SugarScum>).
Note that Cookie Clicker does not tell you the lump type right away
(it only does so after the lump is 43% (3/7) through its auto-harvest time),
so you need to either directly inspect `Game.lumpCurrentType`,
or use save editors or mods.

Alternatively,
you can harvest the lump,
export the save game to a file named `save1.txt`,
reload to before the lump was harvested,
harvest again and save to `save2.txt`, and so on,
creating hundreds of save files.
Then,
some ten hours later
(after the lumps are all past the 43% mark),
you can open the save files one-by-one until some save file has the desired lump type.
This method does not need to inspect the save file or use external tools,
but it is more time consuming than the previous method.

Choose Your Own Lump uses the other lump harvesting method.
We adjust the save file to have the "correct" lump time,
and wait for it to fall (and be auto-harvested) offline.

Note that letting it fall and be auto-harvest whilst online is not viable.
Online auto-harvesting is handled by the function `Game.doLumps`,
which is triggered once every 33ms (as part of `Game.Loop()`).

Manipulating the Next Lump Type
-------------------------------

The lump type is calculated by `Game.computeLumpType()`.

The following factors affect the harvest time of the current lump and the type of the next lump:

- The time that the current lump started growing.
- The internal game seed.
  - I.e. `Game.seed`, a randomly-chosen five-letter string,
    which changes only when ascending and is recorded in the save file.
- The heavenly upgrades Stevia Caelestis, Sucralosia Inutilis, and Sugar Aging Process.
- Which slot Rigidel is in.
  - Note that the dragon aura Supreme Intellect can (in a way) change where Rigidel is slotted.
- The number of grandmas (if Sugar Aging Process is present).
  - Recall that this effect is capped at 600 grandmas.
- Dragon auras Dragon's Curve and Reality Bending.
- The stage of the grandmapocalypse.

(This is an exhaustive list.)

Knowing the factors above is exactly what we need to simulate the choice of the next lump type...
except for the discrepancy, explained below.
(In the code of Choose Your Own Lump,
this simulation is contained in [src/planner/core.ts](src/planner/core.ts)
and [src/planner/processing.ts](src/planner/processing.ts).)

A Wrench in our Plans: The Discrepancy Bug
------------------------------------------

This is a bug in the function `Game.loadLumps`,
which handles offline auto-harvesting.

This function calls `Date.now()` twice.
`Date.now()` returns the current time,
down to millisecond precision.
If the two calls happen in the same millisecond,
all is good:
the next sugar lump starts growing the exact moment that the previous one was auto-harvested.
However,
if the two calls happen in different milliseconds,
the next lump will start growing a few milliseconds late.
This difference between when the lump actually started growing
and when it theoretically should have had
is the **discrepancy**,
and it exactly matches the time elapsed between the two `Date.now()` calls.

For regular gameplay,
sugar lumps starting growing a few milliseconds late is inconsequential,
but for us the millisecond is used as part of the seed,
so we need to compensate for it.
This is the "discrepancy" setting in the options menu.
By default,
Choose Your Own Lump assumes that
there will be a 1ms discrepancy between actual and theoretical lump times,
and adjusts the lump times accordingly when calculating the type of the next lump.

Unfortunately the discrepancy is not deterministic
--- it essentially depends on how fast the JavaScript engine
executes the code between the two `Date.now()` calls,
which in turn is affected by processor speed, current CPU load etc.
Hence some savescumming might be necessary to ensure that the lump actually has the desired type.
Choose Your Own Lump calculates and displays the discrepancy,
so you can adjust the assumed discrepancy accordingly.
If you are on a fast computer and using it exclusively for Cookie Clicker,
you may want to experiment lowering the discrepancy to 0ms.
If your computer is consistently slow,
you can increase it to a value you observe more often.

The discrepancy bug is discussed in detail
(including code analysis)
in <https://github.com/staticvariablejames/cookie-connoisseur/blob/master/doc/discrepancy.md>.


Practice
========

The Lump Tooltip
----------------

This mod looks at every configuration
of grandmas, grandmapocalypse stage, dragon auras, and Rigidel slot,
filters the predictions to the lump types of your choice,
and displays them in the lump tooltip
(the box that appears when you hover the mouse over the sugar lump).
The tooltip looks like this:

![Modified lump tooltip](test/lump-tooltip.test.ts-snapshots/tooltipWithGrandmas-firefox-linux.png "Modified lump tooltip")

Each row of the report contains a configuration,
plus the outcome of that configuration (in the first column).
For example,
the second row in the picture above says that,
if:
- we have 600 or more grandmas;
- we are in stages 0 or 1 of the grandmapocalypse (i.e. before Communal brainsweep);
- both Dragon's Curve and Reality Bending are selected as the dragon auras; and
- Rigidel is active and being worshipped in the diamond slot,
then the next lump type will be caramelized.
So if this is our target lump,
we adjust the game according to these conditions,
export the save,
and when we load the save again after the lump has had fallen,
the lump type will be caramelized.

**This assumes, of course,
that the discrepancy that happens when loading the save game
matches the one assumed during the calculations.**
Thus some savescumming may be needed to guarantee that the discrepancy matches the expected value.
The block of text immediately above the predictions table always displays the lump type
and will give guidance regarding discrepancy.
This value of the expected discrepancy can be adjusted in the settings,
but I believe most players will want that value to be 1ms.

The list of predictions is sorted according to auto-harvest time;
configurations whose lumps auto-harvest earlier show up first in the table.

The heavenly upgrade "Sugar aging process",
which shortens lump auto-harvesting times by 6 seconds per grandma,
is limited to 600 grandmas.
In this case the row will simply say "600+".

Often the prediction will only work in certain grandmapocalypse stages.
If you have already progressed all the way through the grandmapocalypse and are on stage 3,
you can purchase the Elder pledge or the Elder covenant to return to stage 0.
You can check the grandmapocalypse stage on the Status menu,
or by looking at the picture of the grandmas in your buildings list;
they will match the ones displayed in the tooltip.

In some rare cases,
the required stages are on "the middle".
For example,
in the fourth line above,
only stage 1 works.
If you are past this stage,
the only way of still getting the desired lump is to use the Elder covenant
to get out of the grandmapocalypse,
then revoking the Elder covenant to start the grandmapocalypse again,
and exporting the save and quitting the game before the grandmapocalypse progresses to stage 2.
This will "freeze" the grandmapocalypse until the game is reopened,
allowing the lump to be harvested under stage 1.

The predictions table includes checkmarks for each individual component
(the checkmark for the grandmapocalypse stage only appears over the current stage).
The checkmarks can be hidden in the options menu.
The line with all components matching is also highlighted.

The screenshot above shows 8 rows of predictions.
This number can be changed in the options menu
(the default is 10).
You can scroll this list of predictions by scrolling while hovering the lump;
the result is a bit janky but it works.

The screenshot above shows all five lump types.
You can choose to filter this table to only show specific lump types.
**By default,
only predictions resulting in golden and caramelized lumps are shown**.

Summary Display
---------------

In the options menu,
you can also turn on the "summary display",
which shows only a selection of the "best" configurations.

![The predictions summary](test/lump-tooltip.test.ts-snapshots/tooltipSummaryWithGrandmas-firefox-linux.png "The predictions summary")

The mod separates the predictions according to the outcome.
Each row shown is the fastest configuration which also satisfies some additional condition.
- The globally fastest configuration yielding the given lump type (this one is always shown).
- The fastest configuration which stays in the same grandmapocalypse scale.
- The fastest configuration which does not require a change to the pantheon.
  - Note that Rigidel can be "unslotted" by making the number of buildings not a multiple of 10.
- The fastest configuration which does not require changing the dragon auras.
- The fastest configuration which requires neither changing the pantheon nor the dragon auras.
- The fastest configuration "within budget";
  i.e. where the individual components (grandmas and dragon auras)
  can be purchased using at most 1% of the bank.

Each of these conditions can be tweaked in the options menu.
- By default, they are set to "observe",
  meaning that a row satisfying those conditions will show up in the summary.
- Setting them to "ignore" simply means the corresponding row will not be listed.
- You may also set them to "require".
  In this case, all predictions will be filtered to match this condition.
  For example, setting the grandmapocalypse condition to "require"
  will make the budget-respecting condition (and all other conditions)
  to also preserve the grandmapocalypse stage.

Setting all conditions to "observe" will usually show six configurations.
However sometimes fewer rows will show up,
either because the conditions overlap,
or because the condition could not be satisfied.
For example, in the screenshot above,
the globally fastest configuration yielding a golden lump also preserves the grandmapocalypse stage,
so only one row is displayed.
And there was no golden-lump-yielding configuration found within budget,
or which would keep the same dragon auras.

Do note that often there are several equivalent configurations.
For example,
the first configuration yielding a golden lump
is also equivalent to not using Supreme Intellect and slotting Rigidel on the diamond slot;
and having 200 extra grandmas allows one to worship Rigidel one slot lower.
Choose Your Own Lump will usually show only one of the equivalent conditions.

Without Sugar aging process
---------------------------

The number of grandmas only affects lump maturation times
if you have the heavenly upgrade "Sugar aging process".
You can also use this mod before purchasing this upgrade,
in which case the grandma count will not be shown.
Note that,
naturally,
you will have much fewer possible configurations,
so if you are only looking for golden and caramelized lumps,
you will frequently have no configurations resulting in those lumps.

![Lump tooltip without Sugar aging process](test/lump-tooltip.test.ts-snapshots/tooltipWithoutGrandmas-firefox-linux.png "Lump tooltip without Sugar aging process")

The tooltip above highlights a few other options of Choose Your Own Lump:
- The display of the grandmapocalypse stages.
  By default the mod shows them in a single row with large icons.
  You can choose to show them in a compact 2x2 grid instead.
- The display of the dragon auras.
  By default the mod shows the auras in three separate columns
  (one column per aura).
  You can choose to show them in just two columns instead;
  Choose Your Own Lump will do its best to convey all relevant information
  using only two columns.
- The golden lump sprite.
  By default,
  the golden lump icon is the second-to-most-mature one,
  rather than the most-mature one;
  this makes it more visually distinct than the other lump types
  (in the same way that the caramelized lump has its two spikes).
  You may choose to display the most-mature sprite.
- Normally only one equivalent configuration is shown.
  But in this case,
  two configurations yielding the golden lump (which are equivalent) are shown.
  This is because the first configuration can be achieved without changing the pantheon,
  and the second configuration can be achieved without changing dragon auras;
  since these two conditions were marked as "observed" in the options menu for this screenshot,
  both configurations are shown.


Using the mod
=============

The best solution is adding
<https://staticvariablejames.github.io/ChooseYourOwnLump/dist/main.js>
to [Cookie Clicker Mod Manager](https://github.com/klattmose/CookieClickerModManager).

Alternatively,
run
```javascript
    Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/dist/main.js');
```
on your browser JavaScript console,
or create a [bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet) with the code
```javascript
    javascript:Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/dist/main.js');
```


License
=======

Choose Your Own Lump is a Cookie Clicker add-on.
Copyright (C) 2020 Static Variable James

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
