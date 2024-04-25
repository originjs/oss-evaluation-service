<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { Setting, Close, InfoFilled } from '@element-plus/icons-vue';
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
import type { TableColumnCtx } from 'element-plus';

const chooseProjectsRef = ref<InstanceType<typeof ChooseProjectsDialog>>();
let projectsRaw = ref<Array<SoftwareBaseInfo>>([]); // 原始数据，用来展示所有可选项目
const projects = ref<Array<SoftwareBaseInfo>>([]); // 选中的项目，可修改其值改变表格展示的项目
const envInfo = ref<string>();
getProjectsByTechStack('测试', '测试框架-UT').then(response => {
  projectsRaw.value = [...response.data]; // 使用 ... 运算符断开引用，防止原始数据被修改
  projects.value = response.data;
});

const removeProject = (project: SoftwareBaseInfo) => {
  projects.value = projects.value.filter(
    item => !(project.projectId === item.projectId && project.version === item.version),
  );
  chooseProjectsRef.value?.cancelSelectedProject(project);
};

const changeSelectedProjects = () => {
  projects.value = projectsRaw.value.filter(item => item.selected);
};

let benchmarksRaw = ref<BenchmarkIndex[]>([]); // 原始数据
const benchmarkIndex = ref<Array<BenchmarkIndex>>([]); // 选中的 benchmark 指标，修改其值改变展示的表格行(指标项)
getIndexByTechStack('测试框架-UT').then(response => {
  response.data.unshift({
    indexName: 'score',
    displayName: '得分',
    unit: '',
    category: '',
    description: '',
  });
  response.data.unshift({
    indexName: 'version',
    displayName: '版本',
    unit: '',
    category: '',
    description: '',
  });
  benchmarksRaw.value = [...response.data];
  benchmarkIndex.value = response.data;
});

const benchmarkResult = ref<BenchmarkResult[]>([]);
getBenchmarkResultByTechStack('测试框架-UT').then(response => {
  benchmarkResult.value = response.data;
  envInfo.value = response.data[0]?.envInfo;
});

const getMappingKey = project => {
  return `${project.projectId}##${project.version}`;
};

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
  let mappingKey;
  for (const item of benchmarkResult.value) {
    if (!projects.value.some(project => project.projectId === item.projectId)) {
      continue;
    }

    mappingKey = getMappingKey(item);
    if (typeof projectIndexMapping[mappingKey] === 'undefined') {
      projectIndexMapping[mappingKey] = projectBenchmark.length;
      project = {
        projectId: item.projectId,
        projectName: item.projectName,
        displayName: item.displayName,
        version: item.version,
        score: item.score,
      };
      projectBenchmark.push(project);
    }
    project = projectBenchmark[projectIndexMapping[mappingKey]];
    project[item.benchmark] = Number(item.rawValue).toFixed(3);
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
      benchmarkName: `${benchmarkIndexItem.displayName}`,
    };

    if (benchmarkIndexItem.unit) {
      record.benchmarkName += `(${benchmarkIndexItem.unit})`;
    }

    isGoodProjectId = getMappingKey(projectBenchmark[0]); // 初始化一个值，方便后续比较
    for (let i = 0; i < projectBenchmark.length; i++) {
      const projectBenchmarkItem = projectBenchmark[i];
      const indexValue = projectBenchmarkItem[benchmarkIndexItem.indexName];
      const projectId = getMappingKey(projectBenchmarkItem);
      record[projectId] = indexValue && Number(indexValue) !== 0 ? indexValue : '--';
      number1 = record[isGoodProjectId] === '--' ? Infinity : record[isGoodProjectId];
      number2 = record[projectId] === '--' ? Infinity : record[projectId];
      if (Number(number1) > Number(number2)) {
        isGoodProjectId = projectId;
      }
      if (number1 !== Infinity && number2 !== Infinity && number1 !== number2) {
        isAllEqual = false;
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
  benchmarksResultTableData.value = benchmarksResultTableDataRaw.value.filter(
    item =>
      benchmarkIndex.value.some(indexItem => indexItem.indexName === item.indexName) ||
      item.benchmarkName === '得分',
  );
});

const hoveringRow = ref('');
const sortedRow = ref('');
const benchmarkResultProjects = ref<BenchmarkResult[]>([]); // 实际表格展示的列，根据选中的项目，并基于原始表格数据计算更新
watch([projects, benchmarkResultProjectsRaw, sortedRow], () => {
  const res = benchmarkResultProjectsRaw.value.filter(item =>
    projects.value.some(project => {
      // if (typeof project.selectedVersions === 'undefined') {
      //   return project.projectId === item.projectId && project.version?.startsWith(item.version);
      // }
      return project.selectedVersions.includes(item.version);
    }),
  );
  sortedRow.value &&
    res.sort((a, b) => {
      if (!a[sortedRow.value]) {
        return 1;
      }
      if (!b[sortedRow.value]) {
        return -1;
      }
      if (sortedRow.value == 'score') {
        return b[sortedRow.value] - a[sortedRow.value];
      }
      return a[sortedRow.value] - b[sortedRow.value];
    });
  benchmarkResultProjects.value = res;
});

const showChooseProjects = ref(false);
const showChooseBenchmark = ref(false);
const submitProjectBenchmark = ref(false);

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

interface SpanMethodProps {
  row: { category: string };
  column: TableColumnCtx<{ category: string }>;
  rowIndex: number;
  columnIndex: number;
}

let rowLen = 1;
const objectSpanMethod = ({ row, column, rowIndex, columnIndex }: SpanMethodProps) => {
  if (columnIndex === 0 && column.label === '类型') {
    if (rowLen > 1) {
      rowLen--;
      return {
        rowspan: 0,
        colspan: 0,
      };
    }
    let nextIndex = rowIndex + 1;
    while (
      rowIndex < benchmarksResultTableData.value.length &&
      benchmarksResultTableData.value[rowIndex]?.category &&
      benchmarksResultTableData.value[nextIndex]?.category &&
      benchmarksResultTableData.value[rowIndex].category ===
        benchmarksResultTableData.value[nextIndex].category
    ) {
      nextIndex++;
      rowLen++;
    }
    return {
      rowspan: rowLen,
      colspan: 1,
    };
  }
};

const getProjectInfoUrl = (project: SoftwareBaseInfo) => {
  const projectInfo = projectsRaw.value.find(p => p.projectId === project.projectId);
  if (!projectInfo) {
    ElMessage.error('抱歉，系统缺少该开源软件的详情, 我们会尽快提供');
    return;
  }
  window.open(`/#/software-details?repoName=${projectInfo.repoName}`, '_blank');
};
</script>

<template>
  <div>
    <div class="tools" flex justify-between>
      <div flex-col w-full>
        <div flex w-full>
          <div flex w-full>
            <div class="flex flex-items-center mr-8">
              <span>开源软件:</span>
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
              <el-switch size="small" inactive-text="是否并行" />
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
        <div flex mt-10px>
          <div class="flex flex-items-center mr-8" style="font-size: 12px">
            <el-icon style="color: #fdbb7b; margin-right: 8px">
              <InfoFilled />
            </el-icon>
            {{ envInfo }}
          </div>
        </div>
      </div>
    </div>

    <div class="results" mt-20px>
      <el-table
        :data="benchmarksResultTableData"
        class="w-full"
        border
        :cell-style="{ padding: '0px' }"
        :span-method="objectSpanMethod"
        table-layout="auto"
        @cell-mouse-enter="({ indexName }) => (hoveringRow = indexName)"
        @cell-mouse-leave="hoveringRow = ''"
      >
        <el-table-column
          v-if="benchmarksResultTableData.some(item => item.category)"
          width="14px"
          fixed
          prop="category"
          label="类型"
        >
          <template #header><div class="write-vertical-left">类型</div></template>
          <template #default="{ row }"
            ><div class="write-vertical-left">{{ row.category }}</div></template
          >
        </el-table-column>
        <el-table-column fixed prop="benchmarkName" label="Name" width="260">
          <template #default="{ row }">
            <div class="relative flex justify-between">
              <el-tooltip :content="row.description || row.benchmarkName">
                <span class="flex-1">{{ row.benchmarkName }}</span></el-tooltip
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
          :key="getMappingKey(benchmarkResultProject)"
          :prop="getMappingKey(benchmarkResultProject)"
          width="100%"
          class-name="benchmark-value-cell"
          :label="benchmarkResultProject.projectName"
        >
          <template #header="headerScope">
            <div text-center class="table-column-header">
              <el-link
                :underline="false"
                target="_blank"
                @click="getProjectInfoUrl(benchmarkResultProject)"
              >
                {{ headerScope.column.label }}
              </el-link>
              <!-- <el-button v-if="idx < benchmarkResultProjects.length"
                style="top:calc(50% - 16px);right:-26px;z-index: 9999;position: absolute;" :icon="Switch" circle /> -->

              <!-- <el-button class="header-move-btn" :icon="Rank" circle /> -->
              <!-- <el-icon style="position: absolute; top:calc(50% - 10px);left:calc(50% - 10px);font-size: 20px;" circle><Rank /></el-icon> -->
              <el-icon
                class="cursor-pointer hover-color-#F56C6C"
                style="position: absolute; top: 3px; right: 3px"
                @click="removeProject(benchmarkResultProject)"
              >
                <Close />
              </el-icon>
            </div>
          </template>
          <template #default="scope">
            <div
              v-if="scope.row.benchmarkName === '得分' || scope.row.benchmarkName === '版本'"
              class="text-center"
            >
              {{ scope.row[getMappingKey(benchmarkResultProject)] }}
            </div>
            <div v-else text-center :style="computeColor(scope)">
              <div class="font-size-3 h4.5 font-500">
                {{ scope.row[getMappingKey(benchmarkResultProject)]
                }}{{
                  scope.row[getMappingKey(benchmarkResultProject)] === '--' ? '' : scope.row.unit
                }}
              </div>
              <div
                v-if="scope.row[getMappingKey(benchmarkResultProject)] !== '--'"
                :class="isGoodClass(scope)"
                class="flex items-center justify-center font-size-2.5"
              >
                ({{
                  (
                    scope.row[getMappingKey(benchmarkResultProject)] / scope.row.isGoodValue
                  ).toFixed(2)
                }})
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ChooseProjectsDialog
      ref="chooseProjectsRef"
      v-model="showChooseProjects"
      :projects="projectsRaw"
      @change-projects="changeSelectedProjects"
    />
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
  content: '  ';
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 4px;
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
