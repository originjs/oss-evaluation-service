<script setup lang="ts">
import { ProjectsCompare } from '@orginjs/oss-evaluation-components';
const route = useRoute();
const repositories = (() => {
  const repos = route.query.repos as string;
  if (!repos) {
    return [];
  }
  if (typeof repos === 'string') {
    return [repos];
  }
  return repos;
})();
</script>

<template>
  <ProjectsCompare :repositories="repositories" />
</template>

<style scoped lang="less"></style>
