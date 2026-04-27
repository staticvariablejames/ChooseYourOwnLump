/* Utilities that listen to wheel events triggered on the lump icon.
 *
 * I think that the lump tooltip only gets updated roughly 3-4 times per second,
 * so the scrolling is quite janky, but it should work.
 */

import { preferences } from '../preferences';

export let scrolledRows = 0; // How many rows of predictions were scrolled down
export function capScrolledRows(cap: number) {
    if(scrolledRows > cap) scrolledRows = cap;
    if(scrolledRows < 0) scrolledRows = 0;
}

let scrolledPixels = 0;
let scrolledLines = 0;
let scrolledPages = 0; // Can this be fractional? I don't know, assuming yes

// Called by main.js
export function registerLumpIconWheelEventListener() {
    document.getElementById('lumps')!.addEventListener('wheel', ev => {
        /* The following three values are wild guesses,
         * I hope they're good enough for most players
         */
        const pixelsPerRow = 64;
        const linesPerRow = 3;
        const rowsPerPage = preferences.display.rows;
        switch(ev.deltaMode) {
            case WheelEvent.DOM_DELTA_PIXEL:
                scrolledPixels += ev.deltaY;
                scrolledRows += Math.floor(scrolledPixels / pixelsPerRow);
                scrolledPixels = Math.max(scrolledPixels % pixelsPerRow, 0);
                break;
            // The following two are basically untested, I hope they're not too bad
            case WheelEvent.DOM_DELTA_LINE:
                scrolledLines += ev.deltaY;
                scrolledRows += Math.floor(scrolledLines / linesPerRow);
                scrolledLines = Math.max(scrolledLines % linesPerRow, 0);
                break;
            case WheelEvent.DOM_DELTA_PAGE:
                scrolledPages += ev.deltaY;
                scrolledRows += Math.floor(scrolledPages * rowsPerPage);
                scrolledPages = Math.max(scrolledPages % 1, 0);
                break;
        }
        scrolledRows = Math.max(scrolledRows, 0);
    });
}
