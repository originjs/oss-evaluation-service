<script setup lang="ts">
import { Setting, InfoFilled } from '@element-plus/icons-vue';
import {
  getProjectsByTechStack,
  getIndexByTechStack,
  getBenchmarkResultByTechStack,
} from '@orginjs/oss-evaluation-components-api';
import type {
  HandleFilterTableRows,
  HandleSortTableColumns,
  PreventClickIndexName,
  Resource,
} from './BenchmarkCompareContent.vue';
import BenchmarkCompareContent from './BenchmarkCompareContent.vue';

const resource: Resource = {
  getProjects: () => getProjectsByTechStack('前端框架', '前端框架'),
  getBenchmarkIndex: async () => {
    const response = await getIndexByTechStack('前端框架');
    response.data = [
      {
        indexName: 'score',
        displayName: '得分',
        unit: '',
      },
      {
        indexName: 'version',
        displayName: '版本',
        unit: '',
      },
      ...response.data,
    ];
    return response;
  },
  getBenchmarkResult: () => getBenchmarkResultByTechStack('前端框架'),
};

const handleFilterTableRows: HandleFilterTableRows = ({ rows, benchmarkIndex }) => {
  return rows.filter(
    row =>
      benchmarkIndex.some(item => item.indexName === row.indexName) ||
      ['score', 'version'].includes(row.indexName),
  );
};

const handleSortTableColumns: HandleSortTableColumns = (a, b, sortedIndexName) => {
  if (sortedIndexName === 'score') {
    return b[sortedIndexName]! - a[sortedIndexName]!;
  }
};

const preventClickIndexName: PreventClickIndexName = benchmarkName => {
  if (benchmarkName === '版本') {
    return true;
  }
};

const options = {
  handleFilterTableRows,
  handleSortTableColumns,
  preventClickIndexName,
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
    <template #tool-bottom="{ benchmarkResult }">
      <div class="flex flex-items-center font-size-12px">
        <el-icon class="mr-8px" color="#fdbb7b">
          <InfoFilled />
        </el-icon>
        {{ benchmarkResult[0]?.envInfo }}
      </div>
    </template>
    <template #cell-content="{ row, column }">
      <div v-if="row.benchmarkName === '得分' || row.benchmarkName === '版本'" class="text-center">
        {{ row[column.prop] }}
      </div>
    </template>
  </BenchmarkCompareContent>
</template>

<style scoped lang="less"></style>
