import typescript from '@rollup/plugin-typescript';

export default {
    input: 'src/main.ts',
    output: {
        dir: 'dist',
        format: 'umd',
        freeze: false, // Game.registerMod requires the object to be mutable
        name: 'CYOL',
    },
    plugins: [
        typescript(),
    ],
};
