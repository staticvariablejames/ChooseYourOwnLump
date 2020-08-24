Choose Your Own Lump!
=====================

This is an add-on for [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/)
that helps manipulating time
so that the right coalescing lump type can be chosen.


Theory
======

Introduction
------------

_Coalescing sugar lumps_
are the sugar lumps that generate roughly once a day
right under the "Stats" button.
There are five types of sugar lumps:
normal, bifurcated, golden, meaty, and caramelized.
After the current sugar lump is harvested,
the next sugar lump starts growing.

The type of the next sugar lump is randomly determined as soon as the previous one is harvested,
although their appearance only starts differing after 57% of its growth has happened.
The key here is that the [random seed](https://en.wikipedia.org/wiki/Random_seed)
used to determine the next lump type
depends only on the game's random seed
and the time that the lump started growing.
Thus we can look at all the possibilities of time for the "birth" of the lump
and manipulate this value to give us the type we want.

The most obvious way of manipulating the sugar lump birth time
would be simply harvesting a ripe sugar lump at the right moment.
However,
the game uses millisecond precision for determining when the lump started growing,
so if we miss the mark by more than one millisecond we get an essentially random lump type.
We would need to write a script to achieve this super-human reaction time,
and I believe this is a bit too much cheating for my taste.

Therefore,
our goal is to manipulate the growing time of the current sugar lump
and let the game autoharvest it.

Manipulating the Next Lump Type
-------------------------------

The following factors affect the harvest time of the current lump and the type of the next lump:

- The time the current lump started coalescing;
- The heavenly upgrades Stevia Caelestis, Sucralosia Inutilis, and Sugar Aging Process;
- The game seed;
- Which slot Rigidel is in;
- The number of grandmas (if Sugar Aging Process is present);
- Dragon auras Dragon's Curve and Reality Bending; and
- The stage of the grandmapocalypse.

The first three are "persistent",
requiring an ascension to change;
the latter four are "transient" and can be changed within an ascension.

Knowing the factors above is exactly what we need to simulate the choice of the next lump type...
except for the discrepancy, explained below.
(In `ChooseYourOwnLump.js`,
this simulation is contained in the method `CYOL.PersistentState.prototype.predictLumpType`.)

Harvesting Methods
------------------

Besides clicking on the lump to harvest it,
a new sugar lump starts growing if the game is open and the lump falls
(i.e. it becomes overripe, so the lump is autoharvested),
or when a save game is loaded and the game notices the previous lump fell.
Two different pieces of code handle each of the latter two,
and I noticed that the timing of the first one
(lump falling while the game is open)
is unreliable.
So we will use the second one.

The plan goes as follows:
we choose a combination of the transient states that gives us the lump of our choice,
modify the state accordingly,
save the game (preferably exporting it),
wait for the autoharvest time to pass,
load the save game,
and hope for the best.

A Wrench in our Plans
---------------------

There is one issue, however:
the part of the game code which grants us lumps when the game is loaded
(`Game.loadLumps`)
calls `Date.now()` three times,
and Javascript is too slow to guarantee that all these three calls return the same number.
Typically there is a **discrepancy** of one or two milliseconds between these two calls.
This is where savescumming enters.
If we assume that the discrepancy will be 1
(i.e. one millisecond will elapse
between the first and last call of `Date.now()` in `Game.loadLumps`),
we can simulate the calculation of the next lump type accordingly,
and then we just need to load the game a few times until we actually get the simulated discrepancy.

In my machine,
roughly 50% of the time the discrepancy is 1 millisecond,
so this is the default setting for the mod.


Practice
========

This mod looks at every combination of "transient states"
(number of grandmas, dragon auras, Rigidel slot, grandmapocalypse stage),
filter the predictions to the lump types of your choice,
and displays them in the lump tooltip
(the box that appears when you hover the mouse over the sugar lump).
The tooltip looks like this:

![Modified lump tooltip](doc/tooltip.png "Modified lump tooltip")

The "Predicted next lump type" line says that,
if the player makes no changes to its save game,
then the next lump type will be normal.

The first line after that says that,
if the player enters any of the three "positive" stages of the grandmapocalypse,
sets the dragon aura to Dragon's Curve,
and Rigidel on the diamond slot,
then the next sugar lump will be meaty.
If the dragon has already been trained to have two auras,
the second aura must be set to _something other than_ Reality Bending.

The second line says that,
regardless of the grandmapocalypse stage (even in the "stage 0", with appeased grandmas),
if the player sets the dragon auras for Dragon's Curve _and_ Reality Bending
and worships Rigidel in the Jade slot,
then the sugar lump will grow to be caramelized.

**All of this assumes, of course,
that the discrepancy that happens when loading the save game
matches the one assumed during the calculations.**
Thus some savescumming may be needed to guarantee that the discrepancy matches the assumed value.
This value can be adjusted in the settings,
but I believe most users will want that value to be 1.

In the screen above,
the current lump type is bifurcated,
as can be seen in the fourth line of the tooltip.
This line would normally only be displayed in the fourth growth stage of that lump,
but to help with savescumming,
this mod forces the game to always display that line (for non-normal lump types).

Only the predictions whose lump types were selected by the user are shown.
The predictions which result in shortest lump growth time are shown first in the tooltip.
Note that,
for example,
choosing the second prediction in the list above will make the current lump take longer to harvest,
but since caramelized sugar lumps yield more lumps (on average) than meaty sugar lums,
choosing that one yields more lumps overall.

If the heavenly upgrade "Sugar Aging Process" is purchased,
then the number of grandmas matter for the sugar lump growth time.
The required number is displayed right after the colon:

![Modified lump tooltip](doc/tooltip-with-grandmas.png "When the number of grandmas matter")

Sometimes,
the predicted configuration will limit how far (or how early)
in the grandmapocalypse the game can be;
for example, in the last line of the tooltip above,
only the first two stages of the grandmapocalypse
(and Dragon's curve and rigidel on the Ruby slot)
yield the chosen lump type.
If you are past that stage,
the only way of going back is to stop the grandmapocalypse
either through Elder Pledge or Elder Covenant.

In some rare cases,
the required stages are on "the middle".
For example,
in the second line above,
only stages 1 and 2 (awoken and displeased grandmas) work.

You can check the grandmapocalypse stage on the Status menu,
or by looking at the picture of the grandmas in your buildings list;
they will match the ones displayed in the tooltip.

Increasing the number of grandmas by 200 is equivalent to raising Rigidel one slot
(unslotted to Jade, Jade to Ruby, or Ruby do Diamond).
For example,
in the image above,
the third line is equivalent to using 378 grandmas instead of 578
but worshipping Rigidel in the Diamond slot.
They have exactly the same results,
so the mod only displays the one with the most grandmas.


Changelog
=========

1.0.0
-----

Initial release.

1.0.1
-----

Funcionally equivalent states are no longer generated multiple times;
for example,
instead of generating a state with 500 grandmas and Rigidel on the ruby slot
and another state with 300 grandmas and Rigidel on the diamond slot,
only the former one is generated.

1.0.2
-----

States that differ only in the grandmapocalypse stage are now shown together.

More than half of the time all four stages of the grandmapocalypse yield the same lump.
This should help declutter the display screen.
However,
to display everything,
I made the sugar lump tooltip wider in a kludgey manner;
this might cause incompatibilities if any other mod messes with that tooltip.

1.0.3
-----

Update to Cookie Clicker 2.029, CCSE 2.017.

Nothing really changed sugar-lump-wise besides version numbers.


Known Bugs/Limitations
======================

The performance is abysmal:
it takes roughly 5 seconds on my machine to scan through all possibilities.
This is particularly bad when savescumming,
because the mod may try to re-scan all possibilities every time the save game is reloaded.

Although the value of the discrepancy is necessary to make sure everything went smoothly,
the mod currently does _not_ display which value it was;
the only way to verify is to see whether the actual lump type matches the predicted lump type.
