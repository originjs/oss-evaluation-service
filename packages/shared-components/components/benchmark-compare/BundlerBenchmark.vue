<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { Setting, InfoFilled } from '@element-plus/icons-vue';
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
import BenchmarkCompareTable, { EMPTY_VALUE } from './BenchmarkCompareTable.vue';
import type { RowData, ColumnData, CallbackFnParams } from './BenchmarkCompareTable.vue';

const chooseProjectsRef = ref<InstanceType<typeof ChooseProjectsDialog>>();
let projectsRaw = ref<Array<SoftwareBaseInfo & { selected?: boolean }>>([]); // 原始数据，用来展示所有可选项目
const projects = ref<Array<SoftwareBaseInfo>>([]); // 选中的项目，可修改其值改变表格展示的项目
const envInfo = ref<string>();
getProjectsByTechStack('构建工具', '构建工具').then(response => {
  projectsRaw.value = [...response.data]; // 使用 ... 运算符断开引用，防止原始数据被修改
  projects.value = response.data;
});

const onRemoveColumn = ({ projectId, version }: ColumnData) => {
  if (!(projectId && version)) {
    return;
  }

  projects.value = projects.value.filter(item => {
    if (projectId === item.projectId) {
      return item.selectedVersions.length > 1 && item.selectedVersions.some(v => version !== v);
    }
    return true;
  });
  chooseProjectsRef.value?.cancelSelectedProject({ projectId, version });
};

const changeSelectedProjects = () => {
  projects.value = projectsRaw.value.filter(item => item.selected);
};

let benchmarkIndexRaw = ref<BenchmarkIndex[]>([]); // 原始数据
const benchmarkIndex = ref<Array<BenchmarkIndex>>([]); // 选中的 benchmark 指标，修改其值改变展示的表格行(指标项)
getIndexByTechStack('构建工具').then(response => {
  benchmarkIndexRaw.value = [
    {
      indexName: 'score',
      displayName: '得分',
      unit: '',
      category: '',
      description: '',
    },
    {
      indexName: 'version',
      displayName: '版本',
      unit: '',
      category: '',
      description: '',
    },
    ...response.data,
  ];
  benchmarkIndex.value = response.data;
});

const benchmarkResult = ref<BenchmarkResult[]>([]);
getBenchmarkResultByTechStack('构建工具').then(response => {
  benchmarkResult.value = response.data;
  envInfo.value = response.data[0]?.envInfo;
});

const getProjectVersionId = (project: BenchmarkResult) => {
  return `${project.projectId}##${project.version}`;
};

let benchmarksResultTableDataRaw = ref<RowData[]>([]); // 表格原始数据，在接口返回数据后只计算(更新)一次
let benchmarkResultProjectsRaw = ref<ColumnData[]>([]); // 表格列原始数据，按照项目分组后的 benchmarkResult 数据
watch([projects, benchmarkIndexRaw, benchmarkResult], () => {
  // 待异步数据返回后才往下执行
  if (!projects.value.length || !benchmarkResult.value.length || !benchmarkIndexRaw.value.length) {
    return [];
  }

  // 生成列数据
  const pVersionIdToColumn: { [k: string]: ColumnData } = {};
  for (const item of benchmarkResult.value) {
    if (!projects.value.some(project => project.projectId === item.projectId)) {
      continue;
    }
    const pVersionId = getProjectVersionId(item);
    pVersionIdToColumn[pVersionId] = {
      ...item,
      ...pVersionIdToColumn[pVersionId],
      pVersionId,
      [item.benchmark]: Number(item.rawValue).toFixed(3),
    };
  }

  // 生成行数据
  const tableData: RowData[] = [];
  benchmarkIndexRaw.value.forEach(benchmarkIndexItem => {
    const row: RowData = {
      ...benchmarkIndexItem,
      benchmarkName: benchmarkIndexItem.unit
        ? `${benchmarkIndexItem.displayName} (${benchmarkIndexItem.unit})`
        : benchmarkIndexItem.displayName,
      minCellValue: '',
    };

    // 单元格
    const cellValueSet = new Set<number>();
    for (const key of Object.keys(pVersionIdToColumn)) {
      const column = pVersionIdToColumn[key];
      const cellValue =
        Number(column[benchmarkIndexItem.indexName] || 0) === 0 // 考虑3种情况：undefined | '' | '0'
          ? EMPTY_VALUE.EMPTY_CELL
          : (column[benchmarkIndexItem.indexName] as string);
      row[column.pVersionId] = cellValue;
      if (cellValue !== EMPTY_VALUE.EMPTY_CELL) {
        cellValueSet.add(Number(cellValue));
      }
    }

    // 值最小的单元格
    if (cellValueSet.size) {
      row.minCellValue = String(Math.min(...cellValueSet));
    }

    tableData.push(row);
  });

  // 完整的表格行列数据
  benchmarksResultTableDataRaw.value = tableData;
  benchmarkResultProjectsRaw.value = Object.values(pVersionIdToColumn);
});

const benchmarksResultTableData = ref<RowData[]>([]); // 实际表格展示的行，根据选中的指标项，并基于原始表格数据计算更新
watch([benchmarkIndex, benchmarksResultTableDataRaw], () => {
  benchmarksResultTableData.value = benchmarksResultTableDataRaw.value.filter(
    item =>
      benchmarkIndex.value.some(indexItem => indexItem.indexName === item.indexName) ||
      ['score', 'version'].includes(item.indexName),
  );
});

const sortedIndexName = ref<keyof ColumnData>();
const onClickIndexName = ({ row: { benchmarkName, indexName } }: CallbackFnParams) => {
  if (benchmarkName === '版本') {
    return;
  }

  return () => {
    if (sortedIndexName.value === indexName) {
      sortedIndexName.value = undefined;
      return;
    }
    sortedIndexName.value = indexName;
  };
};

const benchmarkResultProjects = ref<ColumnData[]>([]); // 实际表格展示的列，根据选中的项目，并基于原始表格数据计算更新
watch([projects, benchmarkResultProjectsRaw, sortedIndexName], () => {
  const res = benchmarkResultProjectsRaw.value.filter(item =>
    projects.value.some(project => {
      return project.selectedVersions.includes(item.version!);
    }),
  );

  if (sortedIndexName.value) {
    res.sort((a, b) => {
      if (!a[sortedIndexName.value!]) {
        return 1;
      }
      if (!b[sortedIndexName.value!]) {
        return -1;
      }
      if (sortedIndexName.value == 'score') {
        return b[sortedIndexName.value]! - a[sortedIndexName.value]!;
      }
      return (a[sortedIndexName.value!] as number) - (b[sortedIndexName.value!] as number);
    });
  }

  benchmarkResultProjects.value = res;
});

const selectedProject = ref('Vue3');
const selectedCompile = ref('babel');
const selectedLanguage = ref('js');

const showChooseProjects = ref(false);
const showChooseBenchmark = ref(false);

const onClickColumnHeader = (column: ColumnData) => {
  const projectInfo = projectsRaw.value.find(p => p.projectId === column.projectId);
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
              <span>样本工程:</span>
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
            <slot name="application" />
            <el-icon class="cursor-pointer">
              <Setting />
            </el-icon>
          </div>
        </div>
        <div flex mt-10px>
          <div class="flex flex-items-center mr-8">
            <span mr-2>开源软件:</span>
            <el-button text type="primary" @click="showChooseProjects = true">
              {{ projects[0]?.projectName }}等{{ projects.length }}款软件</el-button
            >
          </div>
          <div class="flex flex-items-center mr-8">
            <span mr-2>Benchmarks:</span>
            <el-button text type="primary" @click="showChooseBenchmark = true"
              >{{ benchmarkIndex.length }}项benchmark</el-button
            >
          </div>
          <div class="flex flex-items-center mr-8" style="font-size: 12px">
            <el-icon style="color: #fdbb7b; margin-right: 8px">
              <InfoFilled />
            </el-icon>
            {{ envInfo }}
          </div>
          <!-- <div class="flex flex-items-center mr-8">
            <el-switch size="small" inactive-text="仅显示有数据" />
          </div>-->
        </div>
      </div>
    </div>

    <BenchmarkCompareTable
      :rows="benchmarksResultTableData"
      :columns="benchmarkResultProjects"
      :sorted-index-name="sortedIndexName"
      :options="{
        onClickColumnHeader,
        onClickIndexName,
        onRemoveColumn,
      }"
    >
      <template #index-content="{ row, column }">
        <div
          v-if="row.benchmarkName === '得分' || row.benchmarkName === '版本'"
          class="text-center"
        >
          {{ row[column.pVersionId] }}
        </div>
      </template>
    </BenchmarkCompareTable>

    <ChooseProjectsDialog
      ref="chooseProjectsRef"
      v-model="showChooseProjects"
      :projects="projectsRaw"
      @change-projects="changeSelectedProjects"
    />
    <ChooseBenchmarkDialog
      v-model="showChooseBenchmark"
      v-model:benchmark-index="benchmarkIndex"
      :benchmark-index-raw="benchmarkIndexRaw"
    />
  </div>
</template>

<style scoped lang="less">
@border-color: #e6e6e6;

.tools {
  display: flex;
  border: 1px solid #e6e6e6;
  align-items: center;
  padding: 6px 20px;
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
