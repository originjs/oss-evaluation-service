<script lang="ts">
import type { ColumnData, RowData, CallbackFn } from './BenchmarkCompareTable.vue';
import type {
  SoftwareBaseInfo,
  BenchmarkResult,
  BenchmarkIndex,
  getIndexByTechStack,
  getProjectsByTechStack,
  getBenchmarkResultByTechStack,
} from '@orginjs/oss-evaluation-components-api';

export type Resource = {
  getProjects: () => ReturnType<typeof getProjectsByTechStack>;
  getBenchmarkIndex: () => ReturnType<typeof getIndexByTechStack>;
  getBenchmarkResult: () => ReturnType<typeof getBenchmarkResultByTechStack>;
};

export type HandleFilterTableRows = (params: {
  rows: RowData[];
  benchmarkIndex: BenchmarkIndex[];
}) => RowData[];

export type HandleSortTableColumns = (
  a: ColumnData,
  b: ColumnData,
  sortedIndexName: keyof ColumnData,
) => number | undefined;

export type PreventClickIndexName = (sortedIndexName: string) => boolean | void;
</script>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import ChooseProjectsDialog from './ChooseProjectsDialog.vue';
import ChooseBenchmarkDialog from './ChooseBenchmarkDialog.vue';
import BenchmarkCompareTable, { EMPTY_VALUE } from './BenchmarkCompareTable.vue';

const props = defineProps<{
  resource: Resource;
  options?: {
    handleFilterTableRows?: HandleFilterTableRows;
    handleSortTableColumns?: HandleSortTableColumns;
    preventClickIndexName?: PreventClickIndexName;
  };
}>();
const { resource, options } = toRefs(props);

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
    const prop = `${item.projectId}##${item.version}`;
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

Promise.all([
  resource.value.getProjects(),
  resource.value.getBenchmarkIndex(),
  resource.value.getBenchmarkResult(),
]).then(([{ data: projectsData }, { data: benchmarkIndexData }, { data: benchmarkResultData }]) => {
  projectsRaw.value = projectsData;
  projects.value = projectsData.filter(item => item.version); // 默认仅显示有评测数据的软件
  benchmarkIndexRaw.value = benchmarkIndexData; // 保留原始数据
  benchmarkIndex.value = [...benchmarkIndexData]; // 使用 ... 运算符断开引用，防止原始数据被修改
  benchmarkResult.value = benchmarkResultData;
  initTableData();
});

const removeColumn = ({ projectId, version }: ColumnData) => {
  if (!(projectId && version)) {
    return;
  }
  projects.value = projects.value.filter(item => {
    if (projectId === item.projectId) {
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
  if (options.value?.handleFilterTableRows) {
    return options.value?.handleFilterTableRows({
      rows: tableRowsRaw.value,
      benchmarkIndex: benchmarkIndex.value,
    });
  }

  return tableRowsRaw.value.filter(row =>
    benchmarkIndex.value.some(item => item.indexName === row.indexName),
  );
});

const sortedIndexName = ref<keyof ColumnData>();
// 实际表格展示的列，根据选中的软件、排序方式，并基于原始表格数据计算更新
const tableColumns = computed<ColumnData[]>(() => {
  const columns = tableColumnsRaw.value.filter(column =>
    projects.value.some(
      project =>
        project.projectId === column.projectId &&
        project.selectedVersions.includes(column.version!),
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
      // 自定义排序
      if (options.value?.handleSortTableColumns) {
        const val = options.value.handleSortTableColumns(a, b, sortedIndexName.value!);
        if (typeof val === 'number') {
          return val;
        }
      }
      // 默认从小排到大
      return (a[sortedIndexName.value!] as number) - (b[sortedIndexName.value!] as number);
    });
  }

  return columns;
});

const clickIndexName: CallbackFn<() => void> = ({ row: { benchmarkName, indexName } }) => {
  if (options.value?.preventClickIndexName && options.value.preventClickIndexName(benchmarkName)) {
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
    <div
      class="flex justify-between items-center py-6px px-20px border-solid border-1px border-#e6e6e6"
    >
      <div class="flex-col w-full">
        <slot name="tool-top"></slot>
        <div class="flex mt-10px">
          <slot name="tool-left"></slot>
          <div class="flex flex-items-center mr-8">
            <span class="mr-2">开源软件:</span>
            <el-button text type="primary" @click="showChooseProjects = true"
              >{{ projects[0]?.projectName }}等{{ projects.length }}款软件</el-button
            >
          </div>
          <div class="flex flex-items-center mr-8">
            <span class="mr-2">Benchmarks:</span>
            <el-button text type="primary" @click="showChooseBenchmark = true"
              >{{ benchmarkIndex.length }}项Benchmark</el-button
            >
          </div>
          <slot name="tool-right" :benchmark-result="benchmarkResult"></slot>
        </div>
        <slot name="tool-bottom" :benchmark-result="benchmarkResult"></slot>
      </div>
    </div>

    <BenchmarkCompareTable
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
        <slot name="cell-content" :row="row" :column="column" />
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
