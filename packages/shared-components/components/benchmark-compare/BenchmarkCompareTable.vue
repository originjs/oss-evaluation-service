<script lang="ts">
import type { BenchmarkIndex, BenchmarkResult } from '@orginjs/oss-evaluation-components-api';

export enum EMPTY_VALUE {
  EMPTY_CELL = '--',
}

type requiredRowKey = 'category' | 'description' | 'indexName' | 'unit';
export type RowData = Partial<Omit<BenchmarkIndex, requiredRowKey>> &
  Pick<BenchmarkIndex, requiredRowKey> & {
    benchmarkName: string;
    minCellValue: string;
    [k: string]: string | EMPTY_VALUE.EMPTY_CELL;
  };

export type ColumnData = Partial<Omit<BenchmarkResult, 'projectName'>> &
  Pick<BenchmarkResult, 'projectName'> & { pVersionId: string; [k: string]: string | number };

export type CallbackFnParams = { row: RowData; column: ColumnData };
</script>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue';

type CallbackFn<T> = (params: CallbackFnParams) => T | void;
const props = defineProps<{
  rows: RowData[];
  columns: ColumnData[];
  sortedIndexName?: keyof ColumnData;
  options?: {
    indexNameWidth?: number;
    onClickColumnHeader?: (column: ColumnData) => void;
    onRemoveColumn?: (column: ColumnData) => void;
    onClickIndexName?: CallbackFn<() => void>;
  };
}>();
const { rows, columns, sortedIndexName } = toRefs(props);
const options = computed(() => ({
  indexNameWidth: 260,
  ...(props.options || {}),
}));

interface SpanMethodProps {
  rowIndex: number;
  columnIndex: number;
}
let rowLen = 1;
const objectSpanMethod = ({ rowIndex, columnIndex }: SpanMethodProps) => {
  // 第一列合并单元格
  if (columnIndex === 0) {
    if (rowLen > 1) {
      rowLen--;
      return {
        rowspan: 0,
        colspan: 0,
      };
    }
    let nextIndex = rowIndex + 1;
    while (
      rowIndex < rows.value.length &&
      rows.value[rowIndex]?.category &&
      rows.value[nextIndex]?.category &&
      rows.value[rowIndex]?.category === rows.value[nextIndex]?.category
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

const hoveringIndexName = ref('');

const computeColor: (row: RowData, column: ColumnData) => string = (row, column) => {
  const cellVal = Number(row[column.pVersionId]);
  const min = Number(row.minCellValue);
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
</script>

<template>
  <el-table
    :data="rows"
    border
    :cell-style="{ padding: 0 }"
    :span-method="objectSpanMethod"
    table-layout="auto"
    @cell-mouse-enter="({ indexName }) => (hoveringIndexName = indexName)"
    @cell-mouse-leave="hoveringIndexName = ''"
  >
    <el-table-column prop="category" label="分类" fixed width="48px">
      <template #header><div class="write-vertical-left">分类</div></template>
      <template #default="{ row }"
        ><div class="write-vertical-left">{{ row.category }}</div></template
      >
    </el-table-column>
    <el-table-column prop="benchmarkName" label="指标" fixed :width="options.indexNameWidth">
      <template #default="{ row, column }">
        <div class="relative flex justify-between">
          <el-tooltip :content="row.description || row.benchmarkName">
            <span class="flex-1">{{ row.benchmarkName }}</span>
          </el-tooltip>
          <span
            v-if="options?.onClickIndexName?.({ row, column })"
            v-show="hoveringIndexName === row.indexName || sortedIndexName === row.indexName"
            :class="{
              'cursor-pointer': options.onClickIndexName,
              'i-custom:sorted-thumb': sortedIndexName === row.indexName,
              'i-custom:sort-thumb': sortedIndexName !== row.indexName,
            }"
            class="right-[-6px] absolute top-50% transform-translate-y-[-50%] ml-2 h-5 w-5"
            @click="options.onClickIndexName({ row, column })?.()"
          />
        </div>
      </template>
    </el-table-column>
    <el-table-column
      v-for="column of columns"
      :key="column.pVersionId"
      :prop="column.pVersionId"
      :label="column.projectName"
      class-name="benchmark-value-cell"
    >
      <template #header>
        <div class="text-center">
          <el-link
            v-if="options?.onClickColumnHeader"
            :underline="false"
            target="_blank"
            class="font-bold"
            @click="options?.onClickColumnHeader(column)"
          >
            {{ column.projectName }}
          </el-link>
          <span v-else class="font-bold">{{ column.projectName }}</span>
          <el-icon
            v-if="options?.onRemoveColumn"
            class="cursor-pointer hover-color-#F56C6C"
            @click="options?.onRemoveColumn(column)"
          >
            <Close />
          </el-icon>
        </div>
      </template>
      <template #default="{ row }">
        <slot name="index-content" :row="row" :column="column">
          <div v-if="row[column.pVersionId] === EMPTY_VALUE.EMPTY_CELL" class="text-center">
            <div class="font-size-3 h4.5 font-500">{{ row[column.pVersionId] }}</div>
          </div>
          <div v-else :style="computeColor(row, column)" class="text-center">
            <div class="font-size-3 h4.5 font-500">{{ row[column.pVersionId] }}{{ row.unit }}</div>
            <div
              class="flex items-center justify-center font-size-2.5"
              :class="{ good: Number(row.minCellValue) === Number(row[column.pVersionId]) }"
            >
              ({{ (row[column.pVersionId] / row.minCellValue).toFixed(2) }})
            </div>
          </div>
        </slot>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="less">
// el-table滚动条样式
:deep(.el-scrollbar) {
  .el-scrollbar__bar.is-horizontal .el-scrollbar__thumb {
    height: 8px;
    background-color: #409eff;
  }
}

:deep(.benchmark-value-cell .cell) {
  padding: 0;
}

:deep(.good::after) {
  content: '  ';
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB0PSIxNzEwOTIzMjQ0Njc2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjUwNTQiIGlkPSJteF9uXzE3MTA5MjMyNDQ2NzciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTIyNC4xNiAzOTEuMzZ2NjEwLjA4SDkzLjQ0QzQxLjkyIDEwMDEuNDQgMCA5NjAgMCA5MDkuMjhWNDgzLjM2YzAtNTAuNzIgNDEuOTItOTIgOTMuNDQtOTJoMTMwLjcyek0xMDA2LjA4IDU3My40NGMtMy44NCA2LjcyLTcuNTIgMTIuNjQtMTAuODggMTguMDgtMTYuMTYgMjYuNzItMjIuNCAzNi44LTIwLjMyIDY5LjkyIDAuNDggMTAuMDggMS45MiAyMC4zMiAzLjM2IDMwLjQgNS4yOCAzOS4zNiAxMiA4OC4xNi0yNi4yNCAxMzMuNzYtMjUuOTIgMzEuMzYtMjkuNDQgNDguOC0zMS44NCA2MC40OC0xLjEyIDUuNDQtMi4yNCAxMS4yLTUuMTIgMTYuOTYtMzIuMTYgNjMuNjgtOTAuNTYgOTguNC0xNjUuMjggOTguNEgyNzIuMTZWMzkxLjM2aDI3LjUyYzI5LjI4IDAgOTQuMjQtNjEuNDQgMTU3Ljc2LTE0OS4yOCAyNC4xNi0zMy4yOCAyNC4xNi00MS4xMiAyNC4xNi0xMDEuOTJDNDgxLjYgNjEuNiA1MzMuOTIgMCA2MDAuNjQgMGM2MC4zMiAwIDEzMC41NiAzNC41NiAxMzAuNTYgMTMxLjY4IDAgNTguODgtMTcuNiAxNjguNDgtMjYuNzIgMjIwLjk2IDM0Ljg4LTAuOCA5NC40LTEuOTIgMTQ4LjQ4LTEuOTIgNjMuODQgMCAxMjAuMTYgMzAuNzIgMTUwLjU2IDgyLjQgMjYuNCA0NC45NiAyNy4zNiA5Ny40NCAyLjU2IDE0MC4zMnoiIHAtaWQ9IjUwNTUiIGZpbGw9IiNkNDIzN2EiPjwvcGF0aD48L3N2Zz4=');
}
</style>
