<script setup lang="ts">
import { SoftwareRank } from '@orginjs/oss-evaluation-components';

const router = useRouter();
const goSoftwareDetails = (repoName: string) => {
  console.log(repoName);
  router.push({
    path: '/software-details',
    query: {
      repoName,
    },
  });
};
</script>

<template>
  <SoftwareRank :repo-name @click="goSoftwareDetails" />
</template>

<style scoped lang="less"></style>
