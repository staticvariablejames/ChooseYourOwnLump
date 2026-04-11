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
