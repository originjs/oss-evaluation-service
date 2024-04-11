import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: resolve('./src') },
      { find: '@api', replacement: resolve('./src/api') },
      { find: '@assets', replacement: resolve('./src/assets') },
      { find: '@components', replacement: resolve('./src/components') },
      { find: '@router', replacement: resolve('./src/router') },
      { find: '@utils', replacement: resolve('./src/utils') },
      { find: '@views', replacement: resolve('./src/views') },
      // TODO 开发环境用别名，生产环境引入生产包
      {
        find: /^@orginjs\/oss-evaluation-components\/assets\/(.*)$/,
        replacement: `${resolve('../shared-components/assets')}/$1`,
      },
      {
        find: /^@orginjs\/oss-evaluation-components$/,
        replacement: resolve('../shared-components/components/index.ts'),
      },
      {
        find: /^@orginjs\/oss-evaluation-components\/(.*)$/,
        replacement: `${resolve('../shared-components/components')}/$1`,
      },
    ],
  },
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
});
