<script setup lang="ts">
import { SoftwareDetails } from '@orginjs/oss-evaluation-components';

const route = useRoute();
const router = useRouter();

const repoName = computed(() => String(route.query.repoName ?? ''));

function compareProjects(
  projects: Array<{ repoName: string; logo: string; url: string; description: string }>,
) {
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
