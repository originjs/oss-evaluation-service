<script setup lang="ts">
import type { TableColumnCtx } from 'element-plus';
import { Setting, Rank, Close } from '@element-plus/icons-vue';
import ChooseProjectsDialog from './ChooseProjectsDialog.vue';
import ChooseBenchmarkDialog from './ChooseBenchmarkDialog.vue';
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

getProjectsByTechStack('构建工具', '构建工具').then(response => {
  projects.value = response.data;
});
const benchmarksIndexPromise = getIndexByTechStack('构建工具');
benchmarksIndexPromise.then(response => {
  benchmarks.value = response.data;
});

Promise.all([getBenchmarkResultByTechStack('构建工具'), benchmarksIndexPromise]).then(results => {
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

const submitProjectBenchmark = ref(false);

const selectedProject = ref('Vue3');
const selectedCompile = ref('babel');
const selectedLanguage = ref('js');

const showChooseProjects = ref(false);
const showChooseBenchmark = ref(false);

const randomBg = (scope: { row: any; column: any; $index: number }) => {
  if (scope.row[scope.column.property] === '--') {
    return '';
  }

  let randomNumber = Math.floor(Math.random() * 9);
  //const colors = ['#63bf7c', '#8aca7e', '#f9696c', '#ffec84', '#b1d680', '#fedd81', '#fdc27c', '#fb9374', '#fecb7e'];
  const colors = [
    '#63bf7c',
    '#8aca7e',
    '#ffec84',
    '#b1d680',
    '#fedd81',
    '#fdc27c',
    '#fb9374',
    '#fecb7e',
  ];
  return `background-color: ${colors[randomNumber]};`;
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
      <div flex flex-col w-full>
        <div flex w-full>
          <div flex w-full>
            <div flex flex-items-center mr-8>
              <span mr-2>样本工程:</span>
              <el-select v-model="selectedProject" placeholder="Select" style="width: 200px">
                <el-option label="React示例工程" value="react" style="height: 68px">
                  <div flex flex-items-center>
                    <div>
                      <span i-custom:react mr-2 h-50px w-50px />
                    </div>
                    <div flex flex-col flex-1>
                      <span>React示例工程</span>
                      <span style="color: var(--el-text-color-secondary); font-size: 13px">
                        该工程是一个普通React框架的前端工程
                      </span>
                    </div>
                  </div>
                </el-option>
                <el-option label="Vue3示例工程" value="Vue3" style="height: 68px">
                  <div flex flex-items-center>
                    <div>
                      <span i-custom:vue mr-2 h-50px w-50px />
                    </div>
                    <div flex flex-col flex-1>
                      <span>Vue3示例工程</span>
                      <span style="color: var(--el-text-color-secondary); font-size: 13px">
                        该工程是一个普通Vue3框架的前端工程
                      </span>
                    </div>
                  </div>
                </el-option>
                <el-option label="React大量组件工程" value="react-big" style="height: 68px">
                  <div flex flex-items-center>
                    <div>
                      <span i-custom:react mr-2 h-50px w-50px />
                    </div>
                    <div flex flex-col flex-1>
                      <span>React大量组件工程</span>
                      <span style="color: var(--el-text-color-secondary); font-size: 13px">
                        该工程是一个React框架的前端工程，工程包含1000个组件嵌套组成。
                      </span>
                    </div>
                  </div>
                </el-option>
                <el-option label="Vue3大量组件工程" value="vue3-big" style="height: 68px">
                  <div flex flex-items-center>
                    <div>
                      <span i-custom:vue mr-2 h-50px w-50px />
                    </div>
                    <div flex flex-col flex-1>
                      <span>Vue3大量组件工程</span>
                      <span style="color: var(--el-text-color-secondary); font-size: 13px">
                        该工程是一个Vue3框架的前端工程，工程包含1000个组件嵌套组成。
                      </span>
                    </div>
                  </div>
                </el-option>
              </el-select>
            </div>
            <div flex flex-items-center mr-8>
              <span mr-2>编译器:</span>
              <el-select v-model="selectedCompile" placeholder="Select" style="width: 200px">
                <el-option label="Babel" value="babel" style="height: 68px">
                  <div flex flex-items-center>
                    <div>
                      <span i-custom:babel mr-2 h-50px w-50px />
                    </div>
                    <div flex flex-col flex-1>
                      <span>Babel</span>
                      <span style="color: var(--el-text-color-secondary); font-size: 13px">
                        一个流行的开源JavaScript编译器，用于将新版本的JavaScript代码转换为向后兼容的旧版本代码。
                      </span>
                    </div>
                  </div>
                </el-option>
                <el-option label="SWC" value="swc" style="height: 68px">
                  <div flex flex-items-center>
                    <div>
                      <span i-custom:swc mr-2 h-50px w-50px />
                    </div>
                    <div flex flex-col flex-1>
                      <span>SWC - Speedy Web Compiler</span>
                      <span style="color: var(--el-text-color-secondary); font-size: 13px">
                        一个用Rust编写的开源JavaScript/TypeScript编译器。
                      </span>
                    </div>
                  </div>
                </el-option>
              </el-select>
            </div>
            <div flex flex-items-center mr-8>
              <span mr-2>编程语言:</span>
              <el-select v-model="selectedLanguage" placeholder="Select" style="width: 200px">
                <el-option label="JavaScript" value="js" style="height: 68px">
                  <div flex flex-items-center>
                    <div>
                      <span i-custom:javascript mr-2 h-50px w-50px />
                    </div>
                    <div flex flex-col flex-1>
                      <span>JavaScript</span>
                      <span style="color: var(--el-text-color-secondary); font-size: 13px">
                        样本工程主要使用JavaScript ES6语法编写
                      </span>
                    </div>
                  </div>
                </el-option>
                <el-option label="TypeScript" value="ts" style="height: 68px">
                  <div flex flex-items-center>
                    <div>
                      <span i-custom:typescript mr-2 h-50px w-50px />
                    </div>
                    <div flex flex-col flex-1>
                      <span>TypeScript</span>
                      <span style="color: var(--el-text-color-secondary); font-size: 13px">
                        样本工程主要使用JavaScript ES6语法编写
                      </span>
                    </div>
                  </div>
                </el-option>
              </el-select>
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
          <div class="flex flex-items-center mr-8">
            <span mr-2>开源构建框架:</span>
            <el-button text type="primary" @click="showChooseProjects = true">
              {{ projects[0]?.projectName }}等{{ projects.length }}款软件</el-button
            >
          </div>
          <div class="flex flex-items-center mr-8">
            <span mr-2>Benchmarks:</span>
            <el-button text type="primary" @click="showChooseBenchmark = true"
              >{{ benchmarks.length }}项benchmark</el-button
            >
          </div>
          <div class="flex flex-items-center mr-8">
            <el-switch size="small" inactive-text="仅显示有数据" />
          </div>
        </div>
      </div>
    </div>
    <div class="results" mt-20px>
      <el-table
        :data="benchmarksResultTableData"
        class="w-full"
        height="530px"
        border
        :cell-style="{ padding: '0px' }"
        :summary-method="getSummaries"
        show-summary
      >
        <el-table-column fixed prop="benchmarkName" label="Name" min-width="235" />
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
              :style="randomBg(scope)"
              >{{ scope.row['p' + (idx - 1)] }}</span
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <ApplyNewProjectBenchmarkDialog v-model="submitProjectBenchmark" category="构建工具" />
    <ChooseProjectsDialog v-model="showChooseProjects" :projects="projects" />
    <ChooseBenchmarkDialog
      v-model="showChooseBenchmark"
      :benchmarks="benchmarks"
      @change-value="changeBenchmarks"
    />
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
</style>
