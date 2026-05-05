/* Utilities that listen to wheel events triggered on the lump icon.
 *
 * I think that the lump tooltip only gets updated roughly 3-4 times per second,
 * so the scrolling is quite janky, but it should work.
 */

import { preferences } from '../preferences';

export let scrolledRows = 0; // How many rows of predictions were scrolled down; always an integer
export function capScrolledRows(cap: number) {
    if(scrolledRows > cap) scrolledRows = cap;
    if(scrolledRows < 0) scrolledRows = 0;
}

let percentageOfCurrentRowScrolled = 0; // fractional number between -1 and 1

// Called by main.js
export function registerLumpIconWheelEventListener() {
    document.getElementById('lumps')!.addEventListener('wheel', ev => {
        /* The following three values are wild guesses,
         * I hope they're good enough for most players.
         *
         * (How do I even test ev.deltaMode?
         * It seems that Chromium reliably produces DOM_DELTA_PIXEL,
         * and Firefox does so for touchpad, and produces DOM_DELTA_LINE for mice,
         * but I couldn't find any documentation about this.)
         */
        const pixelsPerRow = 120;
        const linesPerRow = 6;
        const rowsPerPage = preferences.display.rows;

        let newScroll = 0;
        switch(ev.deltaMode) {
            case WheelEvent.DOM_DELTA_PIXEL:
                newScroll = ev.deltaY / pixelsPerRow;
                break;
            case WheelEvent.DOM_DELTA_LINE:
                newScroll = ev.deltaY / linesPerRow;
                break;
            case WheelEvent.DOM_DELTA_PAGE:
                newScroll = ev.deltaY * rowsPerPage;
                break;
        }

        let totalScroll = scrolledRows + percentageOfCurrentRowScrolled + newScroll;
        percentageOfCurrentRowScrolled = totalScroll % 1;
        scrolledRows = totalScroll - percentageOfCurrentRowScrolled;
        scrolledRows = Math.round(scrolledRows); // Is this rounding step needed?
    });
}
