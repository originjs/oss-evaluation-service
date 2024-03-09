import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'pathe';
import AutoImport from 'unplugin-auto-import/vite';
import UnoCSS from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const pathSrc = resolve(__dirname, './src')

export default defineConfig({
  resolve: {
    alias: {
      '/@': pathSrc,
    },
  },
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
    }),
    AutoImport({
      // targets to transform
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
      ],

      // global imports to register
      imports: [
        // presets
        'vue',
        'vue-router',
      ],

      resolvers: [
        ElementPlusResolver(),
      ],
    }),
    Components({
      resolvers: [
        ElementPlusResolver(),
      ],
    }),
    UnoCSS(),
  ],
  build: {
    lib: {
      entry: resolve(pathSrc, 'components/index.ts'),
      name: 'index',
      fileName: 'index',
    },
    watch: {
      include: [pathSrc],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['vue'],
  },
});
