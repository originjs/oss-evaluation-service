import * as VueRouter from 'vue-router';
import { SearchSoftware, SoftwareDetails } from '@/components';
import { TechLandscape } from '@/components';

const routes = [
  {
    path: '/',
    component: { template: '修改 URL 路由地址为对应的组件路由，查看并测试组件' },
  },
  {
    path: '/SearchSoftware',
    component: SearchSoftware,
  },
  {
    path: '/TechLandscape',
    component: TechLandscape,
  },
  {
    path: '/SoftwareDetails',
    component: SoftwareDetails,
  },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});

export default router;
