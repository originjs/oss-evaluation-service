<script setup lang="ts">
import type { TabsPaneContext } from 'element-plus';
import FrameworkBenchmark from './FrameworkBenchmark.vue';
import BundlerBenchmark from './BundlerBenchmark.vue';
import TestFrameworkBenchmark from './TestFrameworkBenchmark.vue';
import SerializationBenchmark from './SerializationBenchmark.vue';

const activeName = ref('frameworks');

const handleClick = (tab: TabsPaneContext, event: Event) => {
  /* eslint-disable no-console */
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
      <el-tab-pane label="XML序列化" name="terminal_serialization_xml">
        <SerializationBenchmark type="终端序列化XML"></SerializationBenchmark>
      </el-tab-pane>
      <el-tab-pane label="JSON序列化" name="terminal_serialization">
        <SerializationBenchmark type="终端序列化JSON"></SerializationBenchmark>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="less">
@border-color: #e6e6e6;

.benchmark-compare-main {
  min-height: calc(100vh - 177px);
  border-bottom: 1px @border-color solid;
  border-right: 1px @border-color solid;
  margin: 0px;
  padding: 20px 20px;
}
</style>
