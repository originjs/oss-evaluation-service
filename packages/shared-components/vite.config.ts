import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// import dts from 'vite-plugin-dts';
// import { resolve } from 'pathe';
import AutoImport from 'unplugin-auto-import/vite';
import UnoCSS from 'unocss/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import glob from 'fast-glob';
import pkg from './package.json';

const excludes = [
  'node_modules',
  'test',
  'dist',
  'uno.config.ts',
  'vite.config.ts',
  'vite-env.d.ts',
  'auto-imports.d.ts',
  'components.d.ts',
];
let files = await glob('**/*.{js,ts,vue}', {
  cwd: '.',
  absolute: true,
  onlyFiles: true,
});
files = files.filter(path => !excludes.some(exclude => path.includes(exclude)));

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: ['vue'],
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    // TODO 类型文件生成
    // dts({
    //   insertTypesEntry: true,
    // }),
  ],
  build: {
    lib: {
      entry: files,
      formats: ['es'],
    },
    rollupOptions: {
      external: id =>
        Object.keys(pkg.peerDependencies).some(dep => id === dep || id.startsWith(`${dep}/`)),
      // TODO 保留目录结构
      // output: {
      //   preserveModules: true,
      //   preserveModulesRoot: '',
      //   // preserveModulesRoot: resolve('components'),
      // },
    },
  },
});
