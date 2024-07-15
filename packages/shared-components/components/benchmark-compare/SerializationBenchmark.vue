<script setup lang="ts">
import { ElMessage } from 'element-plus';
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
import type { RowData, ColumnData } from './BenchmarkCompareTable.vue';

const chooseProjectsRef = ref<InstanceType<typeof ChooseProjectsDialog>>();
let projectsRaw = ref<Array<SoftwareBaseInfo & { selected?: boolean }>>([]); // 原始数据，用来展示所有可选项目
const projects = ref<Array<SoftwareBaseInfo>>([]); // 选中的项目，可修改其值改变表格展示的项目

const props = defineProps<{
  type: string;
}>();

const envInfo = ref<string>();
getProjectsByTechStack('基础库', '序列化').then(response => {
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
getIndexByTechStack(props.type).then(response => {
  benchmarkIndexRaw.value = [
    {
      indexName: 'score',
      displayName: '得分',
      unit: '',
      category: '',
      description: '',
    },
    ...response.data,
  ];
  benchmarkIndex.value = response.data;
});

const benchmarkResult = ref<BenchmarkResult[]>([]);
getBenchmarkResultByTechStack(props.type).then(response => {
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
const onClickIndexName = (indexName: keyof ColumnData) => {
  if (sortedIndexName.value === indexName) {
    sortedIndexName.value = undefined;
    return;
  }
  sortedIndexName.value = indexName;
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
          </div>
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
    />

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
