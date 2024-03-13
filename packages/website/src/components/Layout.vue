<script setup lang="ts">
import AppHeader from '@components/AppHeader.vue'
import AppFooter from '@components/AppFooter.vue'
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
  min-width: 1366px;
}

.page {
  padding-top: 64px;
}
</style>
