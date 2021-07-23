import { settings } from './settings';

/* The next three functions must be available in the global namespace
 * under the CYOL.UI object.
 */

export function discrepancyCallback() {
    let value = (document.getElementById('CYOLdiscrepancySlider') as HTMLInputElement).value ?? 1;
    settings.discrepancy = Number(value);
    document.getElementById('CYOLdiscrepancySliderRightText')!.innerHTML = value;
}

export function rowsToDisplayCallback() {
    let value = (document.getElementById('CYOLrowsToDisplaySlider') as HTMLInputElement).value ?? 10;
    settings.rowsToDisplay = Number(value);
    document.getElementById('CYOLrowsToDisplaySliderRightText')!.innerHTML = value;
}

export function toggleSettings(buttonId: string, settingsName: string, onText: string, offText: string) {
    (settings as any)[settingsName] = !(settings as any)[settingsName];
    let element = document.getElementById(buttonId) as HTMLAnchorElement;
    if((settings as any)[settingsName]) {
        element.classList.remove("off");
        element.innerHTML = onText;
    } else {
        element.classList.add("off");
        element.innerHTML = offText;
    }
}

// Constructs a button for toggling settings[settingsName].
export function makeButton(settingsName:string, onText:string, offText:string) {
    let buttonClass = "option" + ((settings as any)[settingsName] ? "" : " off");
    let buttonId = 'CYOLbutton' + settingsName;
    let onclick = "CYOL.UI.toggleSettings('" + buttonId + "', '" +
        settingsName + "', '" + onText + "', '" + offText + "');" +
        'PlaySound(\'snd/tick.mp3\');';
    return '<a class="' + buttonClass + '"' +
        ' id="' + buttonId + '"' +
        ' onclick="' + onclick + '">' +
        ((settings as any)[settingsName] ? onText : offText) +
        '</a>';
}

export function customOptionsMenu() {
    let menuStr = "";
    menuStr += '<div class="listing">'
        + Game.WriteSlider('CYOLdiscrepancySlider', 'Discrepancy', '[$]', () => settings.discrepancy, 'CYOL.UI.discrepancyCallback()')
        + '</div>';
    menuStr += '<div class="listing">'
        + Game.WriteSlider('CYOLrowsToDisplaySlider', 'Rows of predictions to display', '[$]', () => settings.rowsToDisplay, 'CYOL.UI.rowsToDisplayCallback()')
        + '</div>';

    menuStr += '<div class="listing">';
    menuStr += makeButton('includeNormal', 'Showing normal lumps', 'Hiding normal lumps');
    menuStr += makeButton('includeBifurcated', 'Showing bifurcated lumps', 'Hiding bifurcated lumps');
    menuStr += makeButton('includeGolden', 'Showing golden lumps', 'hiding golden lumps');
    menuStr += makeButton('includeMeaty', 'Showing meaty lumps', 'hiding meaty lumps');
    menuStr += makeButton('includeCaramelized', 'Showing caramelized lumps', 'Hiding caramelized lumps');
    menuStr += '<label>Whether to display or hide predictions resulting in the corresponding lump type</label></div>';

    menuStr += '<div class="listing">';
    menuStr += makeButton('preserveGrandmapocalypseStage', 'Only current grandmapocalypse stage', 'Any grandmapocalypse stage');
    menuStr += '<label>Whether to display only predictions which match the current grandmapocalypse stage or not</label></div>';

    menuStr += '<div class="listing">';
    menuStr += makeButton('preserveDragon', 'Only current dragon auras', 'Any dragon auras');
    menuStr += '<label>Whether to display only predictions which match the current dragon auras or not</label></div>';

    menuStr += '<div class="listing">';
    menuStr += makeButton('preservePantheon', 'Only current pantheon configuration', 'Any pantheon configuration');
    menuStr += '<label>Whether to display only predictions which match the current pantheon or not (note Rigidel can be disabled by manipulating the number of buildings)</label></div>';

    CCSE.AppendCollapsibleOptionsMenu("Choose Your Own Lump", menuStr);
}
