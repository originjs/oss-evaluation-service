import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';
import { ElMessage } from 'element-plus';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@views/Home.vue'),
  },
  {
    name: 'SoftwareDetails',
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
  {
    path: '/software-rank',
    component: () => import('@views/SoftwareRank.vue'),
  },
  {
    path: '/benchmark-compare',
    component: () => import('@views/BenchmarkCompare.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.afterEach(to => {
  if (to.name === 'SoftwareDetails' && to.query.repoName) {
    document.title = `${to.query.repoName} OSS Evaluation 开源先进性评估`;
  } else {
    document.title = 'OSS Evaluation 开源先进性评估';
  }
});

export default router;
