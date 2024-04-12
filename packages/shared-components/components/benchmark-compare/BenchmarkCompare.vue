<script setup lang="ts">
import type { TabsPaneContext } from 'element-plus';
import FrameworkBenchmark from './FrameworkBenchmark.vue';
import BundlerBenchmark from './BundlerBenchmark.vue';
import TestFrameworkBenchmark from './TestFrameworkBenchmark.vue';

const activeName = ref('frameworks');

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event);
};
</script>

<template>
  <div class="benchmark-compare-main">
    <el-tabs v-model="activeName" @tab-click="handleClick">
      <el-tab-pane label="前端框架" name="frameworks">
        <FrameworkBenchmark></FrameworkBenchmark>
      </el-tab-pane>
      <el-tab-pane label="构建工具" name="bundler">
        <BundlerBenchmark></BundlerBenchmark>
      </el-tab-pane>
      <el-tab-pane label="测试框架" name="test_framework">
        <TestFrameworkBenchmark></TestFrameworkBenchmark>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="less">
@border-color: #e6e6e6;

.benchmark-compare-main {
  border-bottom: 1px @border-color solid;
  border-right: 1px @border-color solid;
  margin: 0px;
  padding: 20px 20px;
}
</style>
