<script setup lang="ts"></script>

<template>
  <div class="nav">
    <div class="logo-wrapper">
      <img class="logo" src="/logo.png" alt="logo" />
      <span class="desc">前端先进性评估</span>
    </div>

    <div class="search-wrapper">
      <!--      todo 公共搜索组件 -->
      <button class="search-btn">
        <span class="content">
          <span i-ph-magnifying-glass-bold important-bg-current mt-1 />
          <span class="desc">搜索开源项目</span>
        </span>
      </button>
    </div>

    <!--    todo 后端获取数据渲染菜单 -->
    <el-menu class="menu" mode="horizontal" :ellipsis="false">
      <el-menu-item index="1">评估模型</el-menu-item>
      <el-menu-item index="2">Landscape</el-menu-item>
      <el-menu-item index="3">趋势榜单</el-menu-item>
      <el-menu-item index="4">性能 Benchmark</el-menu-item>
      <el-menu-item index="5">动态</el-menu-item>
    </el-menu>

    <div class="extra-info">
      <a class="link" href="https://github.com/originjs/oss-evaluation-service" target="_blank">
        <el-icon :size="22" color="#666666">
          <Link />
        </el-icon>
      </a>
    </div>
  </div>
</template>

<style scoped lang="less">
.nav {
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  min-width: 900px;
  max-width: 1400px;

  * {
    background-color: transparent;
  }
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

  .search-btn {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    height: 40px;
    background-color: #f6f6f7;
    cursor: pointer;
    outline: none;
    border: 1px solid transparent;
    color: rgba(0, 0, 0, 0.75);

    &:hover {
      border-color: #3451b2;
    }

    .content {
      display: flex;
      align-items: center;

      .desc {
        margin-left: 6px;
      }
    }
  }
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
