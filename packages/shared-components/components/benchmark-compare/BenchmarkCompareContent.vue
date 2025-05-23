<script setup lang="ts">
import { ElMessage } from 'element-plus';
import ChooseProjectsDialog from './ChooseProjectsDialog.vue';
import ChooseBenchmarkDialog from './ChooseBenchmarkDialog.vue';
import BenchmarkCompareTable, { EMPTY_VALUE } from './BenchmarkCompareTable.vue';
import type { BenchmarkTechStack } from '@orginjs/oss-evaluation-api-server';
import {
  getBenchmarkResultByTechStack,
  getIndexByTechStack,
  getProjectsByTechStack,
} from '@orginjs/oss-evaluation-components-api';
import { InfoFilled } from '@element-plus/icons-vue';
import type { ColumnData, RowData, CallbackFn } from './BenchmarkCompareTable.vue';
import type {
  SoftwareBaseInfo,
  BenchmarkResult,
  BenchmarkIndex,
} from '@orginjs/oss-evaluation-components-api';

const props = defineProps<{
  benchmarkTechStacks: BenchmarkTechStack[];
  techStack: string;
  activeTechStack: string;
}>();
const { benchmarkTechStacks, techStack, activeTechStack } = toRefs(props);
const benchmarkTechStack = computed(
  () => benchmarkTechStacks.value.find(item => item.techStack === techStack.value)!,
);

const projectsRaw = ref<SoftwareBaseInfo[]>([]); // 所有软件
const projects = ref<SoftwareBaseInfo[]>([]); // 选中的软件，可修改其值改变展示的表格列
const benchmarkIndexRaw = ref<BenchmarkIndex[]>([]); // 所有指标项
const benchmarkIndex = ref<BenchmarkIndex[]>([]); // 选中的指标项，可修改其值改变展示的表格行
const benchmarkResult = ref<BenchmarkResult[]>([]); // benchmark 结果数据，用于生成单元格值
const tableRowsRaw = ref<RowData[]>([]); // 表格行原始数据
const tableColumnsRaw = ref<ColumnData[]>([]); // 表格列原始数据

const initTableData = () => {
  // 生成列数据
  const propToColumn: { [k: string]: ColumnData } = {};
  for (const item of benchmarkResult.value) {
    const prop = `${item.pId}##${item.version}`;
    propToColumn[prop] = {
      ...item,
      ...propToColumn[prop],
      prop,
      [item.benchmark]: Number(item.rawValue).toFixed(3),
    };
  }
  const columns = Object.values(propToColumn);

  // 生成行数据
  const rows: RowData[] = [];
  benchmarkIndexRaw.value.forEach(benchmarkIndexItem => {
    const row: RowData = {
      ...benchmarkIndexItem,
      minCellValue: '',
      benchmarkName: benchmarkIndexItem.unit
        ? `${benchmarkIndexItem.displayName} (${benchmarkIndexItem.unit})`
        : benchmarkIndexItem.displayName,
    };

    // 单元格
    const cellValueSet = new Set<number>();
    for (const column of columns) {
      const cellValue =
        Number(column[benchmarkIndexItem.indexName] || 0) === 0 // 考虑 3 种情况：undefined | '' | '0'
          ? EMPTY_VALUE.EMPTY_CELL
          : (column[benchmarkIndexItem.indexName] as string);
      row[column.prop] = cellValue;
      if (cellValue !== EMPTY_VALUE.EMPTY_CELL) {
        cellValueSet.add(Number(cellValue));
      }
    }

    // 值最小的单元格
    if (cellValueSet.size) {
      row.minCellValue = String(Math.min(...cellValueSet));
    }

    rows.push(row);
  });

  // 完整的表格行列数据
  [tableRowsRaw.value, tableColumnsRaw.value] = [rows, columns];
};

const isLoadingData = ref(true);
const getData = () => {
  // 已经获取过数据
  if (activeTechStack.value !== techStack.value || projectsRaw.value.length) {
    return;
  }

  isLoadingData.value = true;
  Promise.all([
    getProjectsByTechStack(benchmarkTechStack.value.category, benchmarkTechStack.value.subcategory),
    getIndexByTechStack(benchmarkTechStack.value.techStack),
    getBenchmarkResultByTechStack(benchmarkTechStack.value.techStack),
  ]).then(
    ([{ data: projectsData }, { data: benchmarkIndexData }, { data: benchmarkResultData }]) => {
      projectsRaw.value = projectsData;
      projects.value = projectsData.filter(item => item.version); // 默认仅显示有评测数据的软件
      benchmarkIndexRaw.value = [
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
        ...benchmarkIndexData,
      ]; // 添加指定行；备份原始数据
      benchmarkIndex.value = [...benchmarkIndexRaw.value]; // 使用 ... 运算符断开引用，防止原始数据被修改
      benchmarkResult.value = benchmarkResultData;
      initTableData();
      isLoadingData.value = false;
    },
  );
};
watch(() => activeTechStack.value, getData, { immediate: true });

const removeColumn = ({ pId, version }: ColumnData) => {
  if (!(pId && version)) {
    return;
  }
  projects.value = projects.value.filter(item => {
    if (pId === item.pId) {
      if (item.selectedVersions.length > 1) {
        item.selectedVersions.splice(item.selectedVersions.indexOf(version), 1);
        return true;
      } else {
        item.selectedVersions.length = 0;
        return false;
      }
    }
    return true;
  });
};

// 实际表格展示的行，根据选中的指标项，并基于原始表格数据计算更新
const tableRows = computed<RowData[]>(() => {
  return tableRowsRaw.value.filter(
    row =>
      benchmarkIndex.value.some(item => item.indexName === row.indexName) ||
      ['score', 'version'].includes(row.indexName),
  );
});

const sortedIndexName = ref<keyof ColumnData>();
// 实际表格展示的列，根据选中的软件、排序方式，并基于原始表格数据计算更新
const tableColumns = computed<ColumnData[]>(() => {
  const columns = tableColumnsRaw.value.filter(column =>
    projects.value.some(
      project => project.pId === column.pId && project.selectedVersions.includes(column.version!),
    ),
  );

  if (sortedIndexName.value) {
    columns.sort((a, b) => {
      // 空值排到最后
      if (!a[sortedIndexName.value!]) {
        return 1;
      }
      if (!b[sortedIndexName.value!]) {
        return -1;
      }
      // 分数从大到小排序
      if (sortedIndexName.value === 'score') {
        return b[sortedIndexName.value]! - a[sortedIndexName.value]!;
      }
      // 默认从小排到大
      return (a[sortedIndexName.value!] as number) - (b[sortedIndexName.value!] as number);
    });
  }

  return columns;
});

const clickIndexName: CallbackFn<() => void> = ({ row: { benchmarkName, indexName } }) => {
  // 版本列禁止排序
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

const showChooseProjects = ref(false);
const showChooseBenchmark = ref(false);

const clickColumnHeader = (column: ColumnData) => {
  const projectInfo = projectsRaw.value.find(p => p.pId === column.pId);
  if (!projectInfo) {
    ElMessage.error('抱歉，系统缺少该开源软件的详情, 我们会尽快提供');
    return;
  }
  window.open(`/#/software-details?repoName=${projectInfo.repoName}`, '_blank');
};

const selectedProject = ref('Vue3');
const selectedCompile = ref('babel');
const selectedLanguage = ref('js');
</script>

<template>
  <div v-loading="isLoadingData">
    <div
      class="flex justify-between items-center py-10px px-20px border-solid border-1px border-#e6e6e6"
    >
      <div class="flex-col w-full">
        <div v-if="techStack === '构建工具'" class="flex w-full">
          <div class="flex flex-items-center mr-8">
            <span>样本工程:</span>
            <el-select v-model="selectedProject" placeholder="Select" style="width: 200px">
              <el-option label="React示例工程" value="react" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:react mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>React示例工程</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      该工程是一个普通React框架的前端工程
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="Vue3示例工程" value="Vue3" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:vue mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>Vue3示例工程</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      该工程是一个普通Vue3框架的前端工程
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="React大量组件工程" value="react-big" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:react mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>React大量组件工程</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      该工程是一个React框架的前端工程，工程包含1000个组件嵌套组成。
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="Vue3大量组件工程" value="vue3-big" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:vue mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>Vue3大量组件工程</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      该工程是一个Vue3框架的前端工程，工程包含1000个组件嵌套组成。
                    </span>
                  </div>
                </div>
              </el-option>
            </el-select>
          </div>
          <div class="flex flex-items-center mr-8">
            <span class="mr-2">编译器:</span>
            <el-select v-model="selectedCompile" placeholder="Select" style="width: 200px">
              <el-option label="Babel" value="babel" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:babel mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>Babel</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      一个流行的开源JavaScript编译器，用于将新版本的JavaScript代码转换为向后兼容的旧版本代码。
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="SWC" value="swc" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:swc mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>SWC - Speedy Web Compiler</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      一个用Rust编写的开源JavaScript/TypeScript编译器。
                    </span>
                  </div>
                </div>
              </el-option>
            </el-select>
          </div>
          <div class="flex flex-items-center mr-8">
            <span class="mr-2">编程语言:</span>
            <el-select v-model="selectedLanguage" placeholder="Select" style="width: 200px">
              <el-option label="JavaScript" value="js" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:javascript mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>JavaScript</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      样本工程主要使用JavaScript ES6语法编写
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="TypeScript" value="ts" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:typescript mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
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
        <div class="flex">
          <div class="flex flex-items-center mr-8">
            <span class="mr-2">开源软件:</span>
            <el-button text type="primary" @click="showChooseProjects = true"
              >{{ projects[0]?.projectName }}等{{ projects.length }}款软件
            </el-button>
          </div>
          <div class="flex flex-items-center mr-8">
            <span class="mr-2">Benchmarks:</span>
            <el-button text type="primary" @click="showChooseBenchmark = true"
              >{{ benchmarkIndex.length }}项Benchmark
            </el-button>
          </div>
          <div class="ml-a flex flex-items-center">
            <slot
              name="application"
              :benchmark-tech-stack="benchmarkTechStack"
              :benchmark-tech-stacks="benchmarkTechStacks"
            ></slot>
          </div>
        </div>
        <div v-if="benchmarkResult[0]?.envInfo" class="flex flex-items-center font-size-12px">
          <el-icon class="mr-8px" color="#fdbb7b">
            <InfoFilled />
          </el-icon>
          {{ benchmarkResult[0].envInfo }}
        </div>
      </div>
    </div>

    <BenchmarkCompareTable
      v-if="!isLoadingData && techStack === activeTechStack"
      :rows="tableRows"
      :columns="tableColumns"
      :sorted-index-name="sortedIndexName"
      :options="{
        clickColumnHeader,
        clickIndexName,
        removeColumn,
      }"
    >
      <template #cell-content="{ row, column }">
        <div
          v-if="row.benchmarkName === '得分' || row.benchmarkName === '版本'"
          class="text-center"
        >
          {{ row[column.prop] }}
        </div>
      </template>
    </BenchmarkCompareTable>

    <ChooseProjectsDialog
      v-model="showChooseProjects"
      v-model:projects="projects"
      :projects-raw="projectsRaw"
    />

    <ChooseBenchmarkDialog
      v-model="showChooseBenchmark"
      v-model:benchmark-index="benchmarkIndex"
      :benchmark-index-raw="benchmarkIndexRaw"
    />
  </div>
</template>

<style scoped lang="less"></style>
