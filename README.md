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
The former changes randomly every new ascension,
so we cannot predict its value,
but we can manipulate the latter to choose the type of the next sugar lump.

The most obvious way would be simply harvesting a ripe sugar lump at the right time.
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
