<script setup lang="ts">
import AppHeader from '@components/AppHeader.vue'
import AppFooter from '@components/AppFooter.vue'
</script>

<template>
  <div class="layout">
    <el-container>
      <el-header><AppHeader /></el-header>
      <el-main><slot /></el-main>
      <el-footer><AppFooter /></el-footer>
    </el-container>
  </div>
</template>

<style scoped lang="less">
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.el-header {
  z-index: 30;
}

.el-main {
  overflow: visible;
  padding: 0;
}

.el-footer {
  height: 100%;
  border-top: 1px solid #e2e2e3;
}
</style>
