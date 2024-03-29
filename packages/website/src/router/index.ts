import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';
import { ElMessage } from 'element-plus';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@views/Home.vue'),
  },
  {
    path: '/software-details',
    component: () => import('@views/SoftwareDetails.vue'),
    beforeEnter: to => {
      if (!to.query.repoName) {
        ElMessage.error('缺少 URL 参数');
        return false;
      }
    },
  },
  {
    path: '/tech-landscape',
    component: () => import('@views/TechLandscape.vue'),
  },
  {
    path: '/compare-projects',
    component: () => import('@views/CompareProject.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
