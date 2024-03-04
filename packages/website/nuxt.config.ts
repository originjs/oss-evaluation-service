// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  routeRules: {
    // prerender index route by default
    '/': { prerender: true },
  },
  modules: [
    '@element-plus/nuxt'
  ],
  elementPlus: { /** see:https://nuxt.com/modules/element-plus#options */ }
});
