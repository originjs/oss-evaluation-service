// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: [
    '@orginjs/oss-evaluation-components/dist/style.css',
    '~/assets/less/index.less',
  ],
  modules: [
    '@element-plus/nuxt',
    '@unocss/nuxt',
    '@vueuse/nuxt',
  ],
  devtools: { enabled: true },
  routeRules: {
    // prerender index route by default
    '/': { prerender: true },
  },
});
