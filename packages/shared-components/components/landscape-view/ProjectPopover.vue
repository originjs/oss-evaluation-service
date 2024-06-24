<script setup lang="ts">
import type { Project } from './type';
import GenerateProjectAvatar from './GenerateProjectAvatar.vue';
import { toKilo } from '@orginjs/oss-evaluation-components-utils';

const props = defineProps<{
  project: Project;
  options?: {
    evaluation?: (project: Project) => void;
    goBenchmark?: (project: Project) => void;
  };
}>();

const { project, options } = toRefs(props);
const popoverRef = ref<HTMLElement>();
defineExpose({
  popoverRef,
});

const emit = defineEmits(['mouseenter', 'mouseleave']);
</script>

<template>
  <el-popover ref="popoverRef" v-bind="$attrs" virtual-triggering width="450">
    <div @mouseenter="emit('mouseenter')" @mouseleave="emit('mouseleave')">
      <div flex items-center>
        <div w-70px h-90px mr-3>
          <el-image :src="project.logo" class="bg-white" fit="fill">
            <template #error>
              <GenerateProjectAvatar v-model="project.name" :width="70" :height="70" />
            </template>
          </el-image>
        </div>
        <div flex flex-1 flex-col>
          <span text-lg fw-bold>
            <el-text line-clamp="2">
              {{ project.name }}
            </el-text>
          </span>
          <div flex items-center>
            <div mr-3 flex items-center>
              <span i-custom:star-active font-size-4 mr-1></span>
              {{ toKilo(project.starCount, { fractionDigits: 1, emptyValue: '0' }) }}
            </div>
            <div mr-3 flex items-center>
              <span i-custom:fork-active font-size-4 mr-1></span>
              {{ toKilo(project.forksCount, { fractionDigits: 1, emptyValue: '0' }) }}
            </div>
            <a
              :href="project.htmlUrl"
              target="_blank"
              i-custom:github
              font-size-4
              mr-3
              cursor-pointer
            ></a>
          </div>
        </div>
        <div flex>
          <div v-if="options?.evaluation" flex flex-col mr-3 items-center>
            <el-tooltip effect="light" content="先进性评估" placement="bottom">
              <span
                i-custom:evaluation
                font-size-10
                cursor-pointer
                @click="options.evaluation(project)"
              ></span>
            </el-tooltip>
          </div>
          <div v-if="project?.hasBenchmark == 'Y'" flex flex-col items-center>
            <el-tooltip effect="light" content="性能Benchmark" placement="bottom">
              <span
                i-custom:benchmark
                font-size-10
                :class="{ 'cursor-pointer': options?.goBenchmark }"
                @click="options?.goBenchmark && options?.goBenchmark(project)"
              ></span>
            </el-tooltip>
          </div>
        </div>
      </div>
      <el-text line-clamp="3">
        {{ project.description }}
      </el-text>
    </div>
  </el-popover>
</template>

<style scoped lang="less"></style>
