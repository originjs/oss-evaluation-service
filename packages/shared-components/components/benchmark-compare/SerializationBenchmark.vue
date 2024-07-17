<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue';
import {
  getProjectsByTechStack,
  getIndexByTechStack,
  getBenchmarkResultByTechStack,
} from '@orginjs/oss-evaluation-components-api';
import type {
  HandleFilterTableRows,
  HandleSortTableColumns,
  Resource,
} from './BenchmarkCompareContent.vue';
import BenchmarkCompareContent from './BenchmarkCompareContent.vue';

const props = defineProps<{
  type: '终端序列化XML' | '终端序列化JSON';
}>();

const resource: Resource = {
  getProjects: () =>
    getProjectsByTechStack('基础库', props.type === '终端序列化XML' ? '序列化-XML' : '序列化-JSON'),
  getBenchmarkIndex: async () => {
    const response = await getIndexByTechStack(props.type);
    response.data = [
      {
        indexName: 'score',
        displayName: '得分',
        unit: '',
      },
      ...response.data,
    ];
    return response;
  },
  getBenchmarkResult: () => getBenchmarkResultByTechStack(props.type),
};

const handleFilterTableRows: HandleFilterTableRows = ({ rows, benchmarkIndex }) => {
  return rows.filter(
    row =>
      benchmarkIndex.some(item => item.indexName === row.indexName) ||
      ['score'].includes(row.indexName),
  );
};

const handleSortTableColumns: HandleSortTableColumns = (a, b, sortedIndexName) => {
  if (sortedIndexName === 'score') {
    return b[sortedIndexName]! - a[sortedIndexName]!;
  }
};

const options = {
  handleFilterTableRows,
  handleSortTableColumns,
};
</script>

<template>
  <BenchmarkCompareContent :resource="resource" :options="options">
    <template #tool-right>
      <div class="ml-a flex flex-items-center">
        <slot name="application" />
        <el-icon class="cursor-pointer">
          <Setting />
        </el-icon>
      </div>
    </template>
    <template #cell-content="{ row, column }">
      <div v-if="row.benchmarkName === '得分'" class="text-center">
        {{ row[column.prop] }}
      </div>
    </template>
  </BenchmarkCompareContent>
</template>

<style scoped lang="less"></style>
