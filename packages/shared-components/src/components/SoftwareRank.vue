<script setup lang="ts">
import {
  getStarsTopApi,
} from '@api/SoftwareRank';
import type { rankInfo } from "@api/SoftwareRank";

const rankPage = ref<{
  pageNo: number;
  pageSize: number;
  rankInfo: Array<rankInfo>;
}>({
  pageNo: 0,
  pageSize: 10,
  data: []
});
watchEffect(async () => {
  // TODO request parameter
  const { data } = await getStarsTopApi({pageNo: 0, pageSize: 10}, "star");
  rankPage.value = data;
});

</script>

<template>
<!--TODO CSS Style-->

  <div pb-50px bg-coolgray-50>
    <el-row :gutter="20">
      <el-col :span="6">Start Top 100<div class="grid-content ep-bg-purple" /></el-col>
      <el-col :span="6">Fork Top 100<div class="grid-content ep-bg-purple" /></el-col>
      <el-col :span="6">Contributors Top 100<div class="grid-content ep-bg-purple" /></el-col>
    </el-row>

    <div class="software-rank">
      <div v-for="(item, index) in rankPage.data"  flex flex-items-center h-30px >
        <span class="rank-number">{{ index + 1 }} </span>
        <span class="software-logo"></span>
        <div class="software-info">
          <span class="name">{{ item.name }}</span>
          <div>
            <div>
              <span>{{ item.starCount }}</span>
              <span>{{ item.forkCount }}</span>
              <span>{{ item.contributorCount }}</span>
            </div>
          </div>
        </div>
        <div class="trend"></div>
      </div>
    </div>
  </div>

</template>


<style>
.el-row {
  margin-bottom: 20px;
}
.el-row:last-child {
  margin-bottom: 0;
}
.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>



<style scoped lang="less"></style>
