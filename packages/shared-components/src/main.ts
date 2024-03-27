import { createApp } from 'vue';
import App from './App.vue';
import 'virtual:uno.css';
import './assets/less/index.less';
import router from '@/router';

createApp(App).use(router).mount('#app');
