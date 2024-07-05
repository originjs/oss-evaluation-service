<script setup lang="ts">
import type { Project } from './type';
import { toKilo } from '@orginjs/oss-evaluation-components-utils';
import ProjectThumbnails from './ProjectThumbnails.vue';

const props = defineProps<{
  project: Project;
  options?: {
    evaluation?: (project: Project) => void;
    goBenchmark?: (project: Project) => void;
  };
}>();

const { project, options } = toRefs(props);
</script>

<template>
  <el-popover
    :show-after="200"
    :width="450"
    :offset="5"
    :persistent="false"
    trigger="hover"
    v-bind="$attrs"
  >
    <template #reference><slot name="reference"></slot></template>
    <div>
      <div class="flex items-center mb-3">
        <project-thumbnails
          class="mr-3"
          :project="{ ...project, bigProject: 'N' }"
          :options="{
            boxSize: 70,
            borderColor: '#e5e7eb',
          }"
        />
        <div class="flex flex-1 flex-col">
          <span class="text-lg fw-bold">
            <el-text line-clamp="2">
              {{ project.name }}
            </el-text>
          </span>
          <div class="flex items-center">
            <div class="mr-3 flex items-center">
              <span class="i-custom:star-active font-size-4 mr-1"></span>
              {{ toKilo(project.starCount, { fractionDigits: 1, emptyValue: '0' }) }}
            </div>
            <div class="mr-3 flex items-center">
              <span class="i-custom:fork-active font-size-4 mr-1"></span>
              {{ toKilo(project.forksCount, { fractionDigits: 1, emptyValue: '0' }) }}
            </div>
            <a
              :href="project.htmlUrl"
              target="_blank"
              class="i-custom:github font-size-4 mr-3 cursor-pointer"
            ></a>
          </div>
        </div>
        <div class="flex items-center">
          <slot name="toolbar-left"></slot>
          <slot>
            <div v-if="options?.evaluation" class="toolbar-item flex flex-col items-center">
              <el-tooltip effect="light" content="先进性评估" placement="bottom">
                <span
                  class="i-custom:evaluation font-size-8 cursor-pointer"
                  @click="options.evaluation(project)"
                ></span>
              </el-tooltip>
            </div>
            <div
              v-if="project?.hasBenchmark == 'Y'"
              class="toolbar-item flex flex-col items-center"
            >
              <el-tooltip effect="light" content="性能Benchmark" placement="bottom">
                <span
                  class="i-custom:benchmark font-size-8"
                  :class="{ 'cursor-pointer': options?.goBenchmark }"
                  @click="options?.goBenchmark && options?.goBenchmark(project)"
                ></span>
              </el-tooltip>
            </div>
          </slot>
          <slot name="toolbar-right"></slot>
        </div>
      </div>
      <el-text line-clamp="3">
        {{ project.description }}
      </el-text>
    </div>
  </el-popover>
</template>

<style scoped lang="less">
.toolbar-item + .toolbar-item {
  margin-left: 12px;
}
</style>
