<script setup lang="ts">
import { SoftwareDetails } from '@orginjs/oss-evaluation-components';
import type { SoftwareBaseInfo } from '@orginjs/oss-evaluation-api-server';

const route = useRoute();
const router = useRouter();

const repoName = computed(() => String(route.query.repoName ?? ''));

function compareProjects(projects: SoftwareBaseInfo[]) {
  router.push({
    path: 'compare-projects',
    query: { repos: projects.map(project => project.repoName) },
  });
}
</script>

<template>
  <SoftwareDetails :repo-name @compare-projects="compareProjects" />
</template>

<style scoped lang="less"></style>
