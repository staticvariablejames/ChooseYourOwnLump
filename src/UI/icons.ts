/* Returns a string for a <div> tag that displays the given icon. */
export function makeIcon(icon: string, transparent: boolean = false) {
    let transparency = '';
    let background = '';
    if(icon === 'lump_normal') background += 'background-position: -1392px -672px;';
    if(icon === 'lump_bifurcated') background += 'background-position: -1392px -720px;';
    if(icon === 'lump_golden') background += 'background-position: -1344px -768px;';
    if(icon === 'lump_meaty') background += 'background-position: -1392px -816px;';
    if(icon === 'lump_caramelized') background += 'background-position: -1392px -1296px;';
    if(icon === 'aura_dragons_curve') background += 'background-position: -960px -1200px;';
    if(icon === 'aura_reality_bending') background += 'background-position: -1536px -1200px;';
    if(icon === 'none') background += 'background-position:48px 48px;';
    if(transparent) transparency += 'opacity: 0.2;';
    return '<div class="icon" style="vertical-align: middle; margin: 0 -4px;' + background + transparency + '"></div>';
}

/* Same as above but for buildings instead. */
export function makeGrandmaIcon(type: string, transparent: boolean) {
    let background = "background-image: url('img/buildings.png?v=5');";
    let transparency = '';
    if(type === 'appeased') background += 'background-position: 0px -64px;';
    if(type === 'awoken') background += 'background-position: 0px -128px;';
    if(type === 'displeased') background += 'background-position: -64px -128px;';
    if(type === 'angered') background += 'background-position: -128px -128px;';
    if(transparent) transparency += 'opacity: 0.2;';
    return '<div style="display: inline-block; width:64px; height:64px; vertical-align: middle;' + background + transparency + '"></div>';
}

/* Similar as above, but builds a Rigidel with a pantheon icon instead.
 * slot === 0 means unslotted, slot === 1 means jade slot, 2 is ruby and 3 is diamond. */
export function makeRigidelIcon(slot: number) {
    let rigidel = '<div class="icon" style="background-position:-1056px -912px"></div>';
    let gem_background = '';
    if(slot === 3) gem_background += 'background-position: -1104px -720px;';
    if(slot === 2) gem_background += 'background-position: -1128px -720px;';
    if(slot === 1) gem_background += 'background-position: -1104px -744px;';
    if(slot === 0) gem_background += 'background-position: -1128px -744px;'; // No background
    let gem = '<div class="icon" style="width:24px;height:24px; position:absolute; top: 36px; left: 12px;' + gem_background + '"></div>';
    return '<div style="height: 60px; position:relative; display:inline-block; vertical-align:middle;' + (slot===0 ? 'opacity:0.2' : '') + '">' + rigidel + gem + '</div>';
}
