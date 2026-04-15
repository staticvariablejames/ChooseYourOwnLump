// Settings for building the scripts in the bin/ directory
import { defineConfig } from 'rolldown';

export default {
    build: {
        minify: false,
        rolldownOptions: {
            input: 'script-src/test-planner-validity.ts',
            output: {
                dir: 'bin',
                entryFileNames: 'test-planner-valitidy.js',
                format: 'cjs',
            },
            external: [
                'cookie-connoisseur',
                'playwright',
                'seedrandom',
            ],
        },
    },
};
