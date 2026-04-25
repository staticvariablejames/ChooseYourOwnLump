// Settings for building the scripts in the bin/ directory
import { defineConfig } from 'rolldown';

export default {
    build: {
        minify: false,
        rolldownOptions: {
            input: [
                'script-src/test-planner-validity.ts',
                'script-src/adversarially-constructed-states.ts',
            ],
            output: {
                dir: 'bin',
                entryFileNames: '[name].js',
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
