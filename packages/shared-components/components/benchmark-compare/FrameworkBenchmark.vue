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

let projectsRaw = ref<Array<SoftwareBaseInfo>>([]); // 原始数据，用来展示所有可选项目
const projects = ref<Array<SoftwareBaseInfo>>([]); // 选中的项目，可修改其值改变表格展示的项目
getProjectsByTechStack('前端框架', '前端框架').then(response => {
  projectsRaw.value = [...response.data]; // 使用 ... 运算符断开引用，防止原始数据被修改
  projects.value = response.data;
});

const removeProject = (projectId: string) => {
  projects.value = projects.value.filter(item => projectId !== item.projectId);
};

let benchmarksRaw = ref<BenchmarkIndex[]>([]); // 原始数据
const benchmarkIndex = ref<Array<BenchmarkIndex>>([]); // 选中的 benchmark 指标，修改其值改变展示的表格行(指标项)
getIndexByTechStack('前端框架').then(response => {
  benchmarksRaw.value = [...response.data];
  benchmarkIndex.value = response.data;
});

const benchmarkResult = ref<BenchmarkResult[]>([]);
getBenchmarkResultByTechStack('前端框架').then(response => {
  benchmarkResult.value = response.data;
});

let benchmarksResultTableDataRaw = ref<any[]>([]); // 表格原始数据，在接口返回数据后只计算(更新)一次
let benchmarkResultProjectsRaw = ref<BenchmarkResult[]>([]); // 表格列原始数据，按照项目分组后的 benchmarkResult 数据
watch([benchmarkIndex, benchmarkResult], () => {
  // 待异步数据返回后才往下执行
  if (!benchmarkResult.value.length || !benchmarkIndex.value.length) {
    return [];
  }

  const projectBenchmark: { [key: string]: string | number }[] = [];
  const projectIndexMapping: { [key: string]: number } = {};
  let project: { [key: string]: string | number };
  for (const item of benchmarkResult.value) {
    if (!projects.value.some(project => project.projectId === item.projectId)) {
      continue;
    }

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
  }

  let record: any;
  let isGoodProjectId;
  let isAllEqual;
  let number1, number2;
  const tableData = [];
  benchmarkIndex.value.forEach(benchmarkIndexItem => {
    isAllEqual = true;
    record = {
      ...benchmarkIndexItem,
      benchmarkName: `${benchmarkIndexItem.displayName}(${benchmarkIndexItem.unit})`,
    };
    isGoodProjectId = projectBenchmark[0].projectId; // 初始化一个值，方便后续比较
    for (let i = 0; i < projectBenchmark.length; i++) {
      const projectBenchmarkItem = projectBenchmark[i];
      const indexValue = projectBenchmarkItem[benchmarkIndexItem.indexName];
      const projectId = projectBenchmarkItem.projectId;
      record[projectId] = indexValue && Number(indexValue) !== 0 ? indexValue : '--';
      number1 = record[isGoodProjectId] === '--' ? Infinity : record[isGoodProjectId];
      number2 = record[projectId] === '--' ? Infinity : record[projectId];
      if (Number(number1) > Number(number2)) {
        isAllEqual = false;
        isGoodProjectId = projectId;
      }
    }

    if (!isAllEqual) {
      record['isGoodValue'] = record[isGoodProjectId];
    }
    tableData.push(record);
  });

  benchmarksResultTableDataRaw.value = tableData;
  benchmarkResultProjectsRaw.value = projectBenchmark;
});

const benchmarksResultTableData = ref<any[]>([]); // 实际表格展示的行，根据选中的指标项，并基于原始表格数据计算更新
watch([benchmarkIndex, benchmarksResultTableDataRaw], () => {
  benchmarksResultTableData.value = benchmarksResultTableDataRaw.value.filter(item =>
    benchmarkIndex.value.some(indexItem => indexItem.indexName === item.indexName),
  );
});

const hoveringRow = ref('');
const sortedRow = ref('');
const benchmarkResultProjects = ref<BenchmarkResult[]>([]); // 实际表格展示的列，根据选中的项目，并基于原始表格数据计算更新
watch([projects, benchmarkResultProjectsRaw, sortedRow], () => {
  const res = benchmarkResultProjectsRaw.value.filter(item =>
    projects.value.some(project => project.projectId === item.projectId),
  );
  sortedRow.value &&
    res.sort((a, b) => {
      if (!a[sortedRow.value]) {
        return 1;
      }
      if (!b[sortedRow.value]) {
        return -1;
      }
      return a[sortedRow.value] - b[sortedRow.value];
    });
  benchmarkResultProjects.value = res;
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
  let a, r, g, b;
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
            >{{ benchmarkIndex.length }}项benchmark</el-button
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
        @cell-mouse-enter="({ indexName }) => (hoveringRow = indexName)"
        @cell-mouse-leave="hoveringRow = ''"
      >
        <el-table-column fixed prop="benchmarkName" label="Name" min-width="210">
          <template #default="{ row }">
            <div class="relative flex justify-between">
              <el-tooltip :content="row.description || row.benchmarkName">
                <span class="flex-1 text-center">{{ row.benchmarkName }}</span></el-tooltip
              >
              <span
                v-show="hoveringRow === row.indexName || sortedRow === row.indexName"
                :class="
                  sortedRow === row.indexName ? 'i-custom:sorted-thumb' : 'i-custom:sort-thumb'
                "
                class="right-[-6px] absolute top-50% transform-translate-y-[-50%] ml-2 h-5 w-5 cursor-pointer"
                @click="
                  sortedRow === row.indexName ? (sortedRow = '') : (sortedRow = row.indexName)
                "
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-for="benchmarkResultProject of benchmarkResultProjects"
          :key="benchmarkResultProject.projectId"
          :prop="benchmarkResultProject.projectId"
          min-width="120"
          class-name="benchmark-value-cell"
          :label="benchmarkResultProject.displayName || benchmarkResultProject.projectName"
        >
          <template #header="headerScope">
            <div text-center class="table-column-header">
              {{ headerScope.column.label }}
              <!-- <el-button v-if="idx < benchmarkResultProjects.length"
                style="top:calc(50% - 16px);right:-26px;z-index: 9999;position: absolute;" :icon="Switch" circle /> -->

              <el-button class="header-move-btn" :icon="Rank" circle />
              <!-- <el-icon style="position: absolute; top:calc(50% - 10px);left:calc(50% - 10px);font-size: 20px;" circle><Rank /></el-icon> -->
              <el-icon
                class="cursor-pointer hover-color-#F56C6C"
                style="position: absolute; top: 3px; right: 3px"
                @click="removeProject(benchmarkResultProject.projectId)"
              >
                <Close />
              </el-icon>
            </div>
          </template>
          <template #default="scope">
            <div py-8px px-12px text-center :style="computeColor(scope)">
              <div>
                {{ scope.row[benchmarkResultProject.projectId]
                }}{{ scope.row[benchmarkResultProject.projectId] === '--' ? '' : scope.row.unit }}
              </div>
              <div
                v-if="scope.row[benchmarkResultProject.projectId] !== '--'"
                :class="isGoodClass(scope)"
              >
                ({{
                  (scope.row[benchmarkResultProject.projectId] / scope.row.isGoodValue).toFixed(2)
                }})
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ChooseProjectsDialog v-model="showChooseProjects" :projects="projects" />
    <ChooseBenchmarkDialog
      v-model="showChooseBenchmark"
      :benchmarks="benchmarkIndex"
      @change-value="changeBenchmarks"
    />
    <ApplyNewProjectBenchmarkDialog v-model="submitProjectBenchmark" category="前端框架" />
  </div>
</template>

<style scoped lang="less">
@border-color: #e6e6e6;

:deep(.good::after) {
  position: absolute;
  content: '  ';
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 10px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB0PSIxNzEwOTIzMjQ0Njc2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjUwNTQiIGlkPSJteF9uXzE3MTA5MjMyNDQ2NzciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTIyNC4xNiAzOTEuMzZ2NjEwLjA4SDkzLjQ0QzQxLjkyIDEwMDEuNDQgMCA5NjAgMCA5MDkuMjhWNDgzLjM2YzAtNTAuNzIgNDEuOTItOTIgOTMuNDQtOTJoMTMwLjcyek0xMDA2LjA4IDU3My40NGMtMy44NCA2LjcyLTcuNTIgMTIuNjQtMTAuODggMTguMDgtMTYuMTYgMjYuNzItMjIuNCAzNi44LTIwLjMyIDY5LjkyIDAuNDggMTAuMDggMS45MiAyMC4zMiAzLjM2IDMwLjQgNS4yOCAzOS4zNiAxMiA4OC4xNi0yNi4yNCAxMzMuNzYtMjUuOTIgMzEuMzYtMjkuNDQgNDguOC0zMS44NCA2MC40OC0xLjEyIDUuNDQtMi4yNCAxMS4yLTUuMTIgMTYuOTYtMzIuMTYgNjMuNjgtOTAuNTYgOTguNC0xNjUuMjggOTguNEgyNzIuMTZWMzkxLjM2aDI3LjUyYzI5LjI4IDAgOTQuMjQtNjEuNDQgMTU3Ljc2LTE0OS4yOCAyNC4xNi0zMy4yOCAyNC4xNi00MS4xMiAyNC4xNi0xMDEuOTJDNDgxLjYgNjEuNiA1MzMuOTIgMCA2MDAuNjQgMGM2MC4zMiAwIDEzMC41NiAzNC41NiAxMzAuNTYgMTMxLjY4IDAgNTguODgtMTcuNiAxNjguNDgtMjYuNzIgMjIwLjk2IDM0Ljg4LTAuOCA5NC40LTEuOTIgMTQ4LjQ4LTEuOTIgNjMuODQgMCAxMjAuMTYgMzAuNzIgMTUwLjU2IDgyLjQgMjYuNCA0NC45NiAyNy4zNiA5Ny40NCAyLjU2IDE0MC4zMnoiIHAtaWQ9IjUwNTUiIGZpbGw9IiNkNDIzN2EiPjwvcGF0aD48L3N2Zz4=');
}

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
