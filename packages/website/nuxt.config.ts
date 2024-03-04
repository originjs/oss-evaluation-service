// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/scss/index.scss'],
  modules: [
    '@element-plus/nuxt',
  ],
  devtools: { enabled: true },
  routeRules: {
    // prerender index route by default
    '/': { prerender: true },
  },
  elementPlus: {
    importStyle: 'scss',
  },
});
