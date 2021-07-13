Documentation of the Documentation
==================================

To keep consistency with UI changes,
the two pictures in the [actual documentation](../README.md)
are taken by the test suite itself.

To update the screenshots,
set the environment variable `UPDATE_SCREENSHOTS` before running `npm test`, like this:

    UPDATE_SCREENSHOTS=1 npm test

Simply running `npm test` will not update the pictures.
This prevents upsetting Git if, say, a single pixel in the corner of the screenshot changes.
