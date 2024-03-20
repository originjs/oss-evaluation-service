<script setup lang="ts">
import { SearchSoftware } from '@orginjs/oss-evaluation-components';
import { useWindowScroll } from '@vueuse/core';
import { ElMessage } from 'element-plus';
const { y } = useWindowScroll();
const route = useRoute();
const router = useRouter();

const onSearchSoftwareName = (repoName: string) => {
  router.push({
    path: 'software-details',
    query: {
      repoName,
    },
  });
};

const onSelectMenu = (path: string) => {
  if (path === 'tech-landscape') {
    router.push({ path });
  } else {
    ElMessage.info('建议中，敬请期待');
  }
};
</script>

<template>
  <div class="nav" :class="{ top: route.path === '/' ? y : true }">
    <div class="nav-wrapper">
      <div class="logo-wrapper cursor-pointer" @click="() => router.push('/')">
        <img class="logo" src="/logo.png" alt="logo" />
        <span class="desc">前端先进性评估</span>
      </div>

      <div class="search-wrapper"><SearchSoftware @search-name="onSearchSoftwareName" /></div>

      <!--    todo 后端获取数据渲染菜单 -->
      <el-menu class="menu" mode="horizontal" :ellipsis="false" @select="onSelectMenu">
        <el-menu-item index="1">评估模型</el-menu-item>
        <el-menu-item index="tech-landscape">Landscape</el-menu-item>
        <el-menu-item index="3">趋势榜单</el-menu-item>
        <el-menu-item index="4">性能 Benchmark</el-menu-item>
        <el-menu-item index="5">动态</el-menu-item>
      </el-menu>

      <div class="extra-info">
        <a class="link" href="https://github.com/originjs/oss-evaluation-service" target="_blank">
          <div i-custom:github font-size-5 />
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0 20px;
  z-index: 30;
  border-bottom: 0.5px solid #e2e2e3;
  background-color: #ffffff;
  transition:
    background-color,
    border-bottom-color 0.5s;

  &:not(.top) {
    background-color: transparent;
    border-bottom-color: transparent;
  }
}

.nav-wrapper {
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  min-width: 900px;
  max-width: 1400px;
}

.logo-wrapper {
  display: flex;
  align-items: center;

  .logo {
    height: 40px;
    width: 40px;
  }

  .desc {
    margin-left: 8px;
  }
}

.search-wrapper {
  margin-left: 40px;
  flex: 1;
}

.el-menu {
  height: 64px;
  background-color: transparent;
}

.el-menu-item {
  padding: 14px;
}

.el-menu--horizontal .el-menu-item:not(.is-disabled):hover,
.el-menu--horizontal .el-menu-item:not(.is-disabled):focus {
  background-color: transparent;
}

.el-menu--horizontal > .el-menu-item,
.el-menu--horizontal.el-menu,
.el-menu--horizontal > .el-menu-item.is-active {
  border-bottom: none;
}

.extra-info {
  display: flex;
  align-items: center;

  .link {
    display: flex;

    &:hover .el-icon {
      color: #409eff;
    }
  }
}

.menu + .extra-info::before {
  margin-left: 8px;
  margin-right: 8px;
  width: 1px;
  height: 24px;
  background-color: #666666;
  content: '';
}
</style>
