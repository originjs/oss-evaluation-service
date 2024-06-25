<script setup lang="ts">
import type { BenchmarkIndex } from '@orginjs/oss-evaluation-components-api';
import type { CheckboxValueType } from 'element-plus';

const props = defineProps({
  benchmarkIndexRaw: {
    type: Array<BenchmarkIndex>,
    require: true,
    default: [],
  },
});

const benchmarkIndex = defineModel('benchmarkIndex', {
  type: Array<BenchmarkIndex>,
  required: true,
});

// 所有指标项数据
// 按 category 拆成 { category: [benchmarkIndex, ...] } 的形式，方便展示和计算
const benchmarkIndexRawGroup = computed(() => {
  const groupedBenchmarkRaw: { [key: string]: BenchmarkIndex[] } = {};

  for (const item of props.benchmarkIndexRaw) {
    if (['score', 'version'].includes(item.indexName)) continue; // 过滤掉不需要展示的值

    const key = item.category || 'Benchmarks';
    if (groupedBenchmarkRaw[key]) {
      groupedBenchmarkRaw[key].push(item);
    } else {
      groupedBenchmarkRaw[key] = [item];
    }
  }

  return groupedBenchmarkRaw;
});

type CheckedStatus = {
  [key: string]: {
    checkAll: boolean;
    isIndeterminate: boolean;
    checkedBenchmarkIndex: string[];
  };
};

// 选中的指标项数据
const checkedStatus = computed({
  // 按 category 拆成 { category: CheckStatus } 的形式，方便保存勾选状态
  get() {
    const groupedBenchmark: { [key: string]: BenchmarkIndex[] } = {};
    benchmarkIndex.value.forEach(item => {
      const key = item.category || 'Benchmarks';
      if (groupedBenchmark[key]) {
        groupedBenchmark[key].push(item);
      } else {
        groupedBenchmark[key] = [item];
      }
    });

    const res: CheckedStatus = {};
    for (const key of Object.keys(benchmarkIndexRawGroup.value)) {
      if (!groupedBenchmark[key]?.length) {
        res[key] = {
          checkAll: false,
          isIndeterminate: false,
          checkedBenchmarkIndex: [],
        };
        continue;
      }
      const checkAll = groupedBenchmark[key].length === benchmarkIndexRawGroup.value[key].length;
      res[key] = {
        checkAll,
        isIndeterminate: !checkAll,
        checkedBenchmarkIndex: groupedBenchmark[key].map(item => item.indexName),
      };
    }
    return res;
  },
  // 根据勾选值重组成外面传进来的格式，再使用 emit 回传给父组件
  set(val: CheckedStatus) {
    let res: Array<BenchmarkIndex> = [];
    for (const [k, v] of Object.entries(val)) {
      res = [
        ...res,
        ...benchmarkIndexRawGroup.value[k].filter(item =>
          v.checkedBenchmarkIndex.includes(item.indexName),
        ),
      ];
    }
    benchmarkIndex.value = res;
  },
});

const handleCheckAllChange = (val: CheckboxValueType, category: string) => {
  checkedStatus.value[category].checkedBenchmarkIndex = val
    ? benchmarkIndexRawGroup.value[category].map(item => item.indexName)
    : [];
  checkedStatus.value[category].isIndeterminate = false;
  checkedStatus.value = { ...checkedStatus.value }; // 重新赋值触发 computed 更新
};
const handleCheckedItemsChange = (value: CheckboxValueType[], category: string) => {
  const checkedCount = value.length;
  const allCount = benchmarkIndexRawGroup.value[category].length;
  checkedStatus.value[category].checkAll = checkedCount === allCount;
  checkedStatus.value[category].isIndeterminate = checkedCount > 0 && checkedCount < allCount;
  checkedStatus.value = { ...checkedStatus.value };
};
</script>

<template>
  <el-dialog title="选择Benchmark指标项">
    <el-scrollbar height="500px">
      <div v-for="category of Object.keys(benchmarkIndexRawGroup)" :key="category">
        <span class="inline-block font-size-20px my-16px mx-0px">{{
          category || 'Benchmarks'
        }}</span>
        <el-checkbox
          v-model="checkedStatus[category].checkAll"
          :indeterminate="checkedStatus[category].isIndeterminate"
          class="ml-10px"
          label="全选"
          @change="(val: CheckboxValueType) => handleCheckAllChange(val, category)"
        />
        <el-checkbox-group
          v-model="checkedStatus[category].checkedBenchmarkIndex"
          @change="(val: CheckboxValueType[]) => handleCheckedItemsChange(val, category)"
        >
          <div
            v-for="item of benchmarkIndexRawGroup[category]"
            :key="item.indexName"
            class="flex items-center"
          >
            <el-checkbox :label="item.displayName" :value="item.indexName" />
            <div class="flex-1 font-size-14px ml-8px h-32px lh-32px truncate">
              -- {{ item.description || item.displayName }}
            </div>
          </div>
        </el-checkbox-group>
      </div>
    </el-scrollbar>
  </el-dialog>
</template>

<style scoped lang="less"></style>
