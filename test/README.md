Tests for the mod
=================

Testing a Cookie Clicker mod like Choose Your Own Lump is tough
because the code of Cookie Clicker relies heavily on calling `Date.now()` directly,
so it is impossible to create, say unit tests.
This directory contains a workaround attempt:
running `make download` downloads a copy of Cookie Clicker
(from <https://klattmose.github.io/CookieClicker/Download/Versions/2.029.7z>)
and overrides `Date.now` so that the clock always starts ticking from 2020-08-25 00:00:00 UTC,
which is a few days after the version 2.029 went live.

Then running e.g. `live-server` on this directory provides a version of the game frozen in time,
which allows us to have a consistent test case.
