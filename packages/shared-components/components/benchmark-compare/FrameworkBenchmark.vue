<script setup lang="ts">
import type { TableColumnCtx } from 'element-plus';
import { Setting, Rank, Close } from '@element-plus/icons-vue';
import type {
  SoftwareBaseInfo,
  BenchmarkIndex,
  BenchmarkResult,
} from '@orginjs/oss-evaluation-components-api';
import {
  getProjectsByTechStack,
  getIndexByTechStack,
  getBenchmarkResultByTechStack,
} from '@orginjs/oss-evaluation-components-api';
import ChooseProjectsDialog from './ChooseProjectsDialog.vue';
import ChooseBenchmarkDialog from './ChooseBenchmarkDialog.vue';
import ApplyNewProjectBenchmarkDialog from './ApplyNewProjectBenchmarkDialog.vue';

interface SummaryMethodProps<
  T = { isGoodValue: number; benchmarkName: string; [key: string]: number | string },
> {
  columns: TableColumnCtx<T>[];
  data: T[];
}

const projects = ref<Array<SoftwareBaseInfo>>([]);
const benchmarks = ref<Array<BenchmarkIndex>>([]);
const benchmarksResultTableData = ref<any[]>([]);
const benchmarksResult = ref<BenchmarkResult[]>([]);

getProjectsByTechStack('前端框架', '前端框架').then(response => {
  projects.value = response.data;
});

const benchmarksIndexPromise = getIndexByTechStack('前端框架');
benchmarksIndexPromise.then(response => {
  benchmarks.value = response.data;
});

Promise.all([getBenchmarkResultByTechStack('前端框架'), benchmarksIndexPromise]).then(results => {
  const benchmarkResult = results[0].data as BenchmarkResult[];
  const benchmarksIndexs = results[1].data as BenchmarkIndex[];

  const projectBenchmark: { [key: string]: string | number }[] = [];
  const projectIndexMapping: { [key: string]: number } = {};
  let project: { [key: string]: string | number };
  benchmarkResult.forEach(item => {
    if (typeof projectIndexMapping[item.projectId] === 'undefined') {
      projectIndexMapping[item.projectId] = projectBenchmark.length;
      project = {
        projectId: item.projectId,
        projectName: item.projectName,
        displayName: item.displayName,
      };
      projectBenchmark.push(project);
    }
    project = projectBenchmark[projectIndexMapping[item.projectId]];
    project[item.benchmark] = Number(item.rawValue).toFixed(2);
  });

  let record: any;
  let isGoodIndex;
  let isAllEqual;
  let number1, number2;
  benchmarksIndexs.forEach(item => {
    isAllEqual = true;
    record = { benchmarkName: `${item.displayName}(${item.unit})` };
    isGoodIndex = 0;
    for (let i = 0; i < projectBenchmark.length; i++) {
      record['p' + i] = projectBenchmark[i][item.indexName] || '--';
      number1 = record['p' + isGoodIndex] === '--' ? Number.MAX_VALUE : record['p' + isGoodIndex];
      number2 = record['p' + i] === '--' ? Number.MAX_VALUE : record['p' + i];
      if (Number(number1) > Number(number2)) {
        isAllEqual = false;
        isGoodIndex = i;
      }
    }

    if (!isAllEqual) {
      record['isGoodValue'] = record['p' + isGoodIndex];
    }

    benchmarksResultTableData.value.push(record);
  });
  benchmarksResult.value = projectBenchmark;
});

const showChooseProjects = ref(false);
const showChooseBenchmark = ref(false);
const submitProjectBenchmark = ref(false);
const selectedPlatform = ref('Linxu');

const computeColor = (scope: { row: any; column: any; $index: number }) => {
  if (scope.row[scope.column.property] === '--') {
    return '';
  }
  const row = scope.row;
  const column = scope.column;
  const cellVal = row[column.property];
  const min = Number(row.isGoodValue);   
  const factor = cellVal / min;
  let a,r,g,b;
  if (factor < 2.0) {
     a = factor - 1.0;
     r = (1.0 - a) * 99 + a * 255;
     g = (1.0 - a) * 191 + a * 236;
     b = (1.0 - a) * 124 + a * 132;
  } else {
     a = Math.min((factor - 2.0) / 2.0, 1.0);
     r = (1.0 - a) * 255 + a * 249;
     g = (1.0 - a) * 236 + a * 105;
     b = (1.0 - a) * 132 + a * 108;
  } 
  return `background-color: rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)});`; 
};

const changeBenchmarks = (values: string[]) => {
  console.log('changeBenchmarks', values);
};

const isGoodClass = (scope: { row: any; column: any; $index: number }) => {
  if (scope.row['isGoodValue'] === scope.row[scope.column.property]) {
    return 'good';
  }
  return '';
};

const getSummaries = (param: SummaryMethodProps) => {
  const { columns } = param;
  const sums: string[] = [];
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '得分';
      return;
    }
    sums[index] = 'N/A';
  });
  return sums;
};
</script>

<template>
  <div>
    <div class="tools" flex justify-between>
      <div flex>
        <div class="flex flex-items-center mr-8">
          <span>开源前端框架:</span>
          <el-button text type="primary" @click="showChooseProjects = true">
            {{ projects[0]?.projectName }}等{{ projects.length }}款软件</el-button
          >
        </div>
        <div class="flex flex-items-center mr-8">
          <span>Benchmarks:</span>
          <el-button text type="primary" @click="showChooseBenchmark = true"
            >{{ benchmarks.length }}项benchmark</el-button
          >
        </div>
        <div class="flex flex-items-center mr-8">
          <span mr-2>Platform:</span>
          <el-select v-model="selectedPlatform" style="width: 100px" size="small">
            <el-option label="Linux" value="Linux" />
            <el-option label="Window" value="Window" />
          </el-select>
        </div>
        <div class="flex flex-items-center mr-8">
          <el-switch size="small" inactive-text="仅显示有数据" />
        </div>
      </div>
      <div flex flex-items-center>
        <el-button type="primary" text @click="submitProjectBenchmark = true"
          >增加Benchmark软件</el-button
        >
        <el-icon class="cursor-pointer">
          <Setting />
        </el-icon>
      </div>
    </div>

    <div class="results" mt-20px>
      <el-table
        :data="benchmarksResultTableData"
        class="w-full"
        height="570px"
        border
        :cell-style="{ padding: '0px' }"
        :summary-method="getSummaries"
        show-summary
      >
        <el-table-column fixed prop="benchmarkName" label="Name" min-width="180" />
        <el-table-column
          v-for="idx in benchmarksResult.length"
          :key="idx"
          :prop="'p' + (idx - 1)"
          min-width="100"
          class-name="benchmark-value-cell"
          :label="benchmarksResult[idx - 1]?.displayName || benchmarksResult[idx - 1]?.projectName"
        >
          <template #header="headerScope">
            <div text-center class="table-column-header">
              {{ headerScope.column.label }}
              <!-- <el-button v-if="idx < benchmarksResult.length"
                style="top:calc(50% - 16px);right:-26px;z-index: 9999;position: absolute;" :icon="Switch" circle /> -->

              <el-button class="header-move-btn" :icon="Rank" circle />
              <!-- <el-icon style="position: absolute; top:calc(50% - 10px);left:calc(50% - 10px);font-size: 20px;" circle><Rank /></el-icon> -->
              <el-icon
                class="cursor-pointer hover-color-#F56C6C"
                style="position: absolute; top: 3px; right: 3px"
              >
                <Close />
              </el-icon>
            </div>
          </template>
          <template #default="scope">
            <span
              h-full
              w-full
              block
              py-8px
              px-12px
              :class="isGoodClass(scope)"
              :style="computeColor(scope)"
              >{{ scope.row['p' + (idx - 1)] }}</span
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ChooseProjectsDialog v-model="showChooseProjects" :projects="projects" />
    <ChooseBenchmarkDialog
      v-model="showChooseBenchmark"
      :benchmarks="benchmarks"
      @change-value="changeBenchmarks"
    />
    <ApplyNewProjectBenchmarkDialog v-model="submitProjectBenchmark" category="前端框架" />
  </div>
</template>

<style>
.good::after {
  content: '  ';
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 10px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB0PSIxNzEwOTIzMjQ0Njc2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjUwNTQiIGlkPSJteF9uXzE3MTA5MjMyNDQ2NzciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTIyNC4xNiAzOTEuMzZ2NjEwLjA4SDkzLjQ0QzQxLjkyIDEwMDEuNDQgMCA5NjAgMCA5MDkuMjhWNDgzLjM2YzAtNTAuNzIgNDEuOTItOTIgOTMuNDQtOTJoMTMwLjcyek0xMDA2LjA4IDU3My40NGMtMy44NCA2LjcyLTcuNTIgMTIuNjQtMTAuODggMTguMDgtMTYuMTYgMjYuNzItMjIuNCAzNi44LTIwLjMyIDY5LjkyIDAuNDggMTAuMDggMS45MiAyMC4zMiAzLjM2IDMwLjQgNS4yOCAzOS4zNiAxMiA4OC4xNi0yNi4yNCAxMzMuNzYtMjUuOTIgMzEuMzYtMjkuNDQgNDguOC0zMS44NCA2MC40OC0xLjEyIDUuNDQtMi4yNCAxMS4yLTUuMTIgMTYuOTYtMzIuMTYgNjMuNjgtOTAuNTYgOTguNC0xNjUuMjggOTguNEgyNzIuMTZWMzkxLjM2aDI3LjUyYzI5LjI4IDAgOTQuMjQtNjEuNDQgMTU3Ljc2LTE0OS4yOCAyNC4xNi0zMy4yOCAyNC4xNi00MS4xMiAyNC4xNi0xMDEuOTJDNDgxLjYgNjEuNiA1MzMuOTIgMCA2MDAuNjQgMGM2MC4zMiAwIDEzMC41NiAzNC41NiAxMzAuNTYgMTMxLjY4IDAgNTguODgtMTcuNiAxNjguNDgtMjYuNzIgMjIwLjk2IDM0Ljg4LTAuOCA5NC40LTEuOTIgMTQ4LjQ4LTEuOTIgNjMuODQgMCAxMjAuMTYgMzAuNzIgMTUwLjU2IDgyLjQgMjYuNCA0NC45NiAyNy4zNiA5Ny40NCAyLjU2IDE0MC4zMnoiIHAtaWQ9IjUwNTUiIGZpbGw9IiNkNDIzN2EiPjwvcGF0aD48L3N2Zz4=');
}
</style>

<style scoped lang="less">
@border-color: #e6e6e6;

.tools {
  display: flex;
  border: 1px solid #e6e6e6;
  align-items: center;
  padding: 6px 20px;
}

.results {
  .col {
    display: inline-flex;
    flex-direction: column;
    border-right: 1px @border-color solid;

    .benchmark-name {
      width: 130px;
    }
  }

  :deep(.benchmark-value-cell .cell) {
    padding: 0px !important;
    .header-move-btn {
      color: #0000;
      border-color: #0000;
      background-color: #0000;
      position: absolute;
      top: calc(50% - 16px);
      left: calc(50% - 16px);
      &:hover {
        color: var(--el-button-hover-text-color);
        border-color: var(--el-button-hover-border-color);
        background-color: var(--el-button-hover-bg-color);
      }
    }
  }
}

.choose-projects-dialog {
  .project {
    border: 1px solid #ccc;
    padding: 0px 10px;
    margin-bottom: 5px;
    position: relative;

    &:hover {
      background-color: #b2d4ef;
    }
  }

  .selected {
    border: 1px solid #b2d4ef;
  }
}
</style>
