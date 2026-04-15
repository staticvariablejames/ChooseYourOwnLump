// Settings for building the mod itself
import { defineConfig } from 'rolldown';

export default {
    build: {
        minify: false,
        rolldownOptions: {
            input: 'src/main.ts',
            output: {
                dir: 'dist',
                entryFileNames: 'main.js',
                format: 'iife',
            },
        },
    },
};
