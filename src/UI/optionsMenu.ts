/* Functions to construct CYOL's options menu.
 */
import { preferences } from '../preferences';
import { LumpType, ConditionSetting } from '../planner/types';

type SliderUpdater = {
    updateValue: (newValue: number) => void,
    getDisplayText: (newValue: number) => string,
};

let sliderUpdaters: Record<string, SliderUpdater> = {};

/* This function must be available in the global namespace as CYOL.UI.onSliderUpdate.
 * We make sure this is the case in `main.ts`.
 */
export function onSliderUpdate(id: string) {
    let sliderElement = document.getElementById(`CYOL-slider-${id}`) as HTMLInputElement;
    let rightTextElement = document.getElementById(`CYOL-sliderText-${id}`) as HTMLElement;
    let value = Number(sliderElement.value);
    sliderUpdaters[id].updateValue(value);
    rightTextElement.innerText = sliderUpdaters[id].getDisplayText(value);
}

function makeSlider(options: {
    id: string,
    updateValue: (newValue: number) => void,
    getDisplayText: (newValue: number) => string,
    currentValue: number,
    sliderTitle: string,
    maxValue: number,
}) {
    sliderUpdaters[options.id] = {
        updateValue: options.updateValue,
        getDisplayText: options.getDisplayText,
    };
    return `
    <div class="sliderBox">
        <div style="float:left;" class="smallFancyButton">${options.sliderTitle}</div>
        <div style="float:right;" class="smallFancyButton" id="CYOL-sliderText-${options.id}">
            ${options.getDisplayText(options.currentValue)}
        </div>
        <input class="slider" id="CYOL-slider-${options.id}"
               style="clear:both;"
               type="range" min="0" max="${options.maxValue}" step="1"
               value="${options.currentValue}"
               onchange="CYOL.UI.onSliderUpdate('${options.id}')"
               oninput="CYOL.UI.onSliderUpdate('${options.id}')"
               onmouseup="PlaySound('snd/tick.mp3');">
    </div>`;
}

function makeConditionsSlider(options: {
    id: string,
    sliderTitle: string,
    currentValue: ConditionSetting,
    updateValue: (newValue: ConditionSetting) => void
}) {
    function updateValue(newValue: number) {
        if(newValue == 0) options.updateValue('require');
        if(newValue == 1) options.updateValue('observe');
        if(newValue == 2) options.updateValue('ignore');
    }
    function getDisplayText(newValue: number) {
        if(newValue == 0) return "Require";
        if(newValue == 1) return "Observe";
        return "Ignore";
    }
    let currentValue = 0;
    if(options.currentValue == 'observe') currentValue = 1;
    if(options.currentValue == 'ignore') currentValue = 2;

    return makeSlider({
        id: options.id,
        updateValue,
        getDisplayText,
        currentValue,
        sliderTitle: options.sliderTitle,
        maxValue: 2,
    });
}

type ButtonUpdater = {
    getCurrentValue: () => boolean,
    updateValue: (newValue: boolean) => void,
    getDisplayText: (newValue: boolean) => string,
};

let buttonUpdaters: Record<string, ButtonUpdater> = {};

/* This function must be available in the global namespace as CYOL.UI.onButtonClick.
 * We make sure this is the case in `main.ts`.
 */
export function onButtonClick(id: string) {
    let button = document.getElementById(`CYOL-button-${id}`) as HTMLAnchorElement;
    let newValue = !buttonUpdaters[id].getCurrentValue();
    buttonUpdaters[id].updateValue(newValue);
    if(newValue) {
        button.classList.remove("off");
    } else {
        button.classList.add("off");
    }
    button.innerText = buttonUpdaters[id].getDisplayText(newValue);
    PlaySound('snd/tick.mp3');
}

function makeButton(options: {
    id: string,
    getCurrentValue: () => boolean,
    updateValue: (newValue: boolean) => void,
    buttonText: string,
}) {
    function getDisplayText(newValue: boolean) {
        return options.buttonText + (newValue ? ' ON' : ' OFF');
    }
    buttonUpdaters[options.id] = {
        getCurrentValue: options.getCurrentValue,
        updateValue: options.updateValue,
        getDisplayText,
    };
    return `
        <a id="CYOL-button-${options.id}"
           class="smallFancyButton prefButton option${options.getCurrentValue() ? "" : " off"}"
           onclick="CYOL.UI.onButtonClick('${options.id}')"
        >
            ${getDisplayText(options.getCurrentValue())}
        </a>`;
}

function makeIncludeLumpButton(lumpType: LumpType) {
    let capitalizedName = lumpType[0].toUpperCase() + lumpType.slice(1);
    let id = 'include' + capitalizedName;
    return makeButton({
        id,
        getCurrentValue: () => preferences.filtering.includeType[lumpType],
        updateValue: (newValue) => {preferences.filtering.includeType[lumpType] = newValue},
        buttonText: capitalizedName,
    });
}

/* This function is pushed to CCSE's `Game.customStatsMenu` on init by main.ts.
 */
export function customOptionsMenu() {
    let menuStr = "";
    menuStr += '<div class="listing">' +
        makeSlider({
            id: 'discrepancy',
            updateValue: (newValue) => {preferences.discrepancy = newValue},
            getDisplayText: (newValue) => String(newValue) + 'ms',
            currentValue: preferences.discrepancy,
            sliderTitle: "Discrepancy",
            maxValue: 100,
        }) +
    '</div>';

    menuStr += '<div class="listing">' +
        makeButton({
            id: 'threeColumnDragonAuras',
            getCurrentValue: () => {return preferences.filtering.threeColumnDragonAuras},
            updateValue: (newValue: boolean) => {
                preferences.filtering.threeColumnDragonAuras = newValue;
            },
            buttonText: 'Display dragon auras in three columns',
        }) +
        `<label>Whether to show the dragon auras in three columns,
                or to compress the display in only two columns.
        </label>
    </div>`;

    menuStr += '<div class="listing">' +
        makeButton({
            id: 'filteredReport',
            getCurrentValue: () => {return preferences.display.reportType == 'filtered'},
            updateValue: (newValue: boolean) => {
                if(newValue) preferences.display.reportType = 'filtered';
                else preferences.display.reportType = 'fullList';
            },
            buttonText: 'Filtered display',
        }) +
        `<label>If on, shows only the "best configuration",
                otherwise show the full list of predictions.
        </label>
    </div>`;

    menuStr += '<div class="listing">' +
        makeButton({
            id: 'compactGrandmapocalypseRepresentation',
            getCurrentValue: () => {return preferences.display.compactGrandmapocalypseRepresentation},
            updateValue: (newValue: boolean) => {
                preferences.display.compactGrandmapocalypseRepresentation = newValue;
            },
            buttonText: 'Compact grandmapocalypse stages',
        }) +
        `<label>Whether to display the valid grandmapocalypse stages
                as a large 1x4 row or as a compact 2x2 grid
        </label>
    </div>`;

    menuStr += '<div class="listing">' +
        makeSlider({
            id: 'rowsToDisplay',
            updateValue: (newValue) => {preferences.display.rows = newValue},
            getDisplayText: (newValue) => String(newValue),
            currentValue: preferences.display.rows,
            sliderTitle: "Rows of predictions to display",
            maxValue: 100,
        }) +
        `<label>Number of rows to be displayed, if showing the full list of predictions</label>` +
    '</div>';

    menuStr += '<div class="listing">' +
        makeButton({
            id: 'showCheckmark',
            getCurrentValue: () => {return preferences.display.showCheckmark},
            updateValue: (newValue: boolean) => {
                preferences.display.showCheckmark = newValue;
            },
            buttonText: 'Show checkmark',
        }) +
        `<label>Whether to show a checkmark (or sometimes a warning sign)
                in the top right corner of the icons in the tooltip
        </label>
    </div>`;

    // Copy CSS styles from the info menu
    menuStr += '<div class="update small"><div class="title">Lump Types</div></div>';

    for(let lumpType of ['normal', 'bifurcated', 'golden', 'meaty', 'caramelized'] as LumpType[]) {
        menuStr += '<div class="listing">' + makeIncludeLumpButton(lumpType) +
            `<label>Whether to list predictions that yield ${lumpType} lumps</label>` +
        `</div>`;
    }

    menuStr += '<div class="update small"><div class="title">Filtering conditions</div></div>';

    menuStr += '<div class="listing">' +
        makeConditionsSlider({
            id: 'preserveGrandmapocalypseStage',
            sliderTitle: "Match current grandmapocalypse stage",
            currentValue: preferences.filtering.conditions.preserveGrandmapocalypseStage,
            updateValue: (newValue) => {
                preferences.filtering.conditions.preserveGrandmapocalypseStage = newValue
            },
        }) +
        `<label>Whether to list only predictions that match the current grandmapocalypse stage ("require"),
                to include those predictions in the filtered report but not require this condition ("observe"),
                or to not worry about this requirement at all ("ignore").
        </label>` +
    '</div>';

    menuStr += '<div class="listing">' +
        makeConditionsSlider({
            id: 'preservePantheon',
            sliderTitle: "Match current pantheon configuration",
            currentValue: preferences.filtering.conditions.preservePantheon,
            updateValue: (newValue) => {
                preferences.filtering.conditions.preservePantheon = newValue
            },
        }) +
        `<label>Similar, but for pantheon configuration.
                Note that Rigidel can be disabled without changing the pantheon
                by manipulating the number of buildings.
        </label>` +
    '</div>';

    menuStr += '<div class="listing">' +
        makeConditionsSlider({
            id: 'preserveDragon',
            sliderTitle: "Match current dragon auras",
            currentValue: preferences.filtering.conditions.preserveDragon,
            updateValue: (newValue) => {
                preferences.filtering.conditions.preserveDragon = newValue
            },
        }) +
        `<label>Similar, but for the dragon auras.
                Additionally, if both "preserve pantheon" and "preserve dragon" are set to "observe",
                the filtered report also includes a row observing both conditions at the same time.
        </label>` +
    '</div>';

    menuStr += '<div class="listing">' +
        makeConditionsSlider({
            id: 'respectBudget',
            sliderTitle: "Budget conscious",
            currentValue: preferences.filtering.conditions.respectBudget,
            updateValue: (newValue) => {
                preferences.filtering.conditions.respectBudget = newValue
            },
        }) +
        `<label>Similar, but for configurations whose individual components
                (grandmas and each dragon aura)
                can be purchased using at most 1% of the current bank.
        </label>` +
    '</div>';

    CCSE.AppendCollapsibleOptionsMenu("Choose Your Own Lump", menuStr);
}
