import { PlannerCore } from '../src/planner/core';
import { makeConfigurationsIterator } from '../src/planner/processing';

let commands: Record<string, () => void> = {
    'grandmaless-sad-seed-search': () => {
        let core = new PlannerCore({
            seed: 'mesad',
        });
        let found = false;
        while(!found) {
            core.currentLumpT++;
            found = true;
        middleLoop:
            for(let configuration of makeConfigurationsIterator(core)) {
                for(let type of core.lumpTypePredictionSet(configuration)) {
                    if(type != 'normal') {
                        found = false;
                        break middleLoop;
                    }
                }
            }
        }
        console.log(core.currentLumpT);
    },
};

let command = process.argv[2];

if(process.argv.length != 3 || !(command in commands)) {
    console.log(`Available commands: ${Object.keys(commands).join(' ')}`);
} else {
    commands[command]();
}
