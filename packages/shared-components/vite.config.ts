import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'pathe';
import AutoImport from 'unplugin-auto-import/vite';
import UnoCSS from 'unocss/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

const pathSrc = resolve(__dirname, './src');

export default defineConfig({
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
      '@': pathSrc,
      '@api': resolve(__dirname, './src/api'),
      '@assets': resolve(__dirname, './src/assets'),
      '@components': resolve(__dirname, './src/components'),
      '@router': resolve(__dirname, './src/router'),
      '@utils': resolve(__dirname, './src/utils'),
      '@views': resolve(__dirname, './src/views'),
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

      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    UnoCSS(),
  ],
  build: {
    lib: {
      entry: resolve(pathSrc, 'components/index.ts'),
      name: 'index',
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'vue',
        'element-plus',
        'echarts',
        'axios',
        '@vueuse/core',
        '@orginjs/oss-evaluation-components',
        '@element-plus/icons-vue',
      ],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          echarts: 'Echarts',
          axios: 'Axios',
          '@vueuse/core': 'VueUseCore',
          '@orginjs/oss-evaluation-components': 'OssEvaluationComponents',
          '@element-plus/icons-vue': 'ElementPlusIconsVue',
        },
      },
    },
    cssCodeSplit: true,
  },
  optimizeDeps: {
    exclude: ['vue'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
});
