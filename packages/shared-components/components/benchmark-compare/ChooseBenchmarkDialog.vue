<script setup lang="ts">
import type { BenchmarkIndex } from '@orginjs/oss-evaluation-components-api';
const props = defineProps({
  benchmarks: {
    type: Array<BenchmarkIndex>,
    require: true,
  },

  value: {
    type: Boolean,
    defalut: false,
    require: true,
  },
});

const emit = defineEmits(['changeValue']);

const selectedBenchmarks = ref<Array<string>>([]);
const changeCheckBoxVal = (value: any[]) => {
  emit('changeValue', value);
};
</script>

<template>
  <el-dialog title="选择Benchmark指标项" class="choose-benchmark-dialog">
    <div overflow-y-auto h-500px>
      <el-checkbox-group v-model="selectedBenchmarks" @change="changeCheckBoxVal">
        <div v-for="(item, index) in props.benchmarks" :key="item.indexName">
          <div
            v-if="
              index == 0 ||
              props.benchmarks![index].category != props.benchmarks![index - 1].category
            "
            font-size-20px
            fw-bolder
            my-16px
            mx-0px
          >
            <span>{{ item.category || 'Benchmarks' }}</span>
            <el-button type="primary" text>全选</el-button>
          </div>
          <div flex items-center>
            <el-checkbox :label="item.displayName" :value="item.indexName" checked />
            <div flex-1 font-size-14px ml-8px h-32px lh-32px truncate>
              -- {{ item.description || item.displayName }}
            </div>
          </div>
        </div>
      </el-checkbox-group>
    </div>
  </el-dialog>
</template>

<style scoped lang="less"></style>
