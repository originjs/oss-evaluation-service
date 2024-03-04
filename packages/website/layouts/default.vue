<script setup lang="ts">
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

<style scoped lang="scss">
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
}

.el-footer {
  height: 100%;
  border-top: 1px solid #e2e2e3;
}
</style>
