<script setup lang="ts">
import { ProjectsCompare } from '@orginjs/oss-evaluation-components';
const router = useRouter();
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

const removeRepo = (repoName: string) => {
  let repos = route.query.repos;
  if (!repos) return;

  repos = typeof repos === 'string' ? [repos] : repos;
  repos = repos?.filter(repo => repo !== repoName);
  router.push({
    path: route.path,
    query: { repos },
  });
};
</script>

<template>
  <ProjectsCompare :repositories="repositories" @remove-repo="removeRepo" />
</template>

<style scoped lang="less"></style>
