<script setup lang="ts">
</script>

<template>
  <div class="layout">
    <AppHeader/>
    <div class="page">
      <slot/>
    </div>
    <AppFooter/>
  </div>
</template>

<style scoped lang="less">
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.page {
  padding: 64px 20px 20px;
}
</style>
