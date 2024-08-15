<script setup lang="ts">
import FrameworkBenchmark from './FrameworkBenchmark.vue';
import BundlerBenchmark from './BundlerBenchmark.vue';
import TestFrameworkBenchmark from './TestFrameworkBenchmark.vue';
import SerializationBenchmark from './SerializationBenchmark.vue';
import { ApplyAdd } from '../apply-add';
import { createReusableTemplate } from '@vueuse/core';

const [DefineTemplate, ReuseTemplate] = createReusableTemplate();

const activeName = ref('frameworks');
</script>

<template>
  <div class="benchmark-compare-main">
    <DefineTemplate>
      <slot name="application">
        <ApplyAdd :application-type="3">
          <template #trigger>
            <el-button type="primary" text>新增Benchmark</el-button>
          </template>
          <template #dialog-header>
            <div font-size-18px>新增Benchmark</div>
          </template>
        </ApplyAdd>
      </slot>
    </DefineTemplate>
    <el-tabs v-model="activeName">
      <el-tab-pane label="前端框架" name="frameworks">
        <FrameworkBenchmark>
          <template #application>
            <ReuseTemplate />
          </template>
        </FrameworkBenchmark>
      </el-tab-pane>
      <el-tab-pane label="构建工具" name="bundler">
        <BundlerBenchmark>
          <template #application>
            <ReuseTemplate />
          </template>
        </BundlerBenchmark>
      </el-tab-pane>
      <el-tab-pane label="测试框架" name="test_framework">
        <TestFrameworkBenchmark>
          <template #application>
            <ReuseTemplate />
          </template>
        </TestFrameworkBenchmark>
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
