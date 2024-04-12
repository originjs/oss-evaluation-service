<script setup lang="ts">
import AppHeader from '@components/AppHeader.vue';
import AppFooter from '@components/AppFooter.vue';
</script>

<template>
  <div class="flex flex-col min-h-100vh min-w-1366px">
    <AppHeader />
    <div class="pt-64px h-[fit-content]">
      <slot />
    </div>
    <AppFooter />
  </div>
</template>

<style scoped lang="less"></style>
