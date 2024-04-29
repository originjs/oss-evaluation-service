import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
// import { terser } from "rollup-plugin-terser";
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/app.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'es',
    sourcemap: false,
  },
  plugins: [
    typescript(), // translate typescript
    json(), // import json files
    resolve(), // tells Rollup how to find usages in node_modules
    commonjs({
      include: /node_modules/,
      requireReturnsDefault: 'auto',
    }), // converts to ES modules
    //  production && terser(), // minify, but only in production
  ],
};
