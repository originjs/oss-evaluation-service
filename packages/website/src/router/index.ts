import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@views/Home.vue'),
  },
  {
    path: '/software-details',
    component: () => import('@views/SoftwareDetails.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
