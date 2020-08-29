// Mock the date
const rightAfterUpdate = 1598313600000; // 2020-08-25 00:00:00 UTC
let currentDate = Date.now();
let actualDateNow = Date.now;
Date.now = () => actualDateNow() - currentDate + rightAfterUpdate;

// Load mod
window.addEventListener('load', function() {
    window.setTimeout(function(){
        Game.LoadMod('https://staticvariablejames.github.io/ChooseYourOwnLump/ChooseYourOwnLump.js');
    }, 1000);
})
