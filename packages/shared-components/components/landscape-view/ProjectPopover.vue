<script setup lang="ts">
import type { Project } from './type';
import { toKilo } from '@orginjs/oss-evaluation-components-utils';
import ProjectThumbnails from './ProjectThumbnails.vue';

const props = defineProps<{
  project: Project;
  options?: {
    evaluation?: (project: Project) => void;
    goBenchmark?: (project: Project) => void;
    toTechRadar?: (project: Project) => void;
  };
}>();

const { project, options } = toRefs(props);

enum RadarRing {
  Adopt = 0,
  Trial = 1,
  Assess = 2,
  Hold = 3,
}

const radarRingNames = {
  [RadarRing.Adopt]: '采纳',
  [RadarRing.Trial]: '试验',
  [RadarRing.Assess]: '评估',
  [RadarRing.Hold]: '暂缓',
};

const radarRingColors = {
  [RadarRing.Adopt]: '#5ba300',
  [RadarRing.Trial]: '#009eb0',
  [RadarRing.Assess]: '#c7ba00',
  [RadarRing.Hold]: '#e09b96',
};
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
        <div class="min-w210px flex flex-1 flex-col">
          <span class="text-lg fw-bold">
            <el-text w-full line-clamp="2">
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
        <div class="max-w132px flex flex-wrap items-center">
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
            <el-tooltip
              v-if="typeof project?.radarRing === 'number'"
              effect="light"
              :content="`技术雷达：${radarRingNames[project.radarRing]}`"
              placement="bottom"
            >
              <span
                class="toolbar-item"
                px-2px
                font-600
                rounded
                border-solid
                border-size-2
                :style="{
                  'border-color': radarRingColors[project.radarRing],
                  color: radarRingColors[project.radarRing],
                }"
                :class="{ 'cursor-pointer': options?.toTechRadar }"
                @click="options?.toTechRadar && options?.toTechRadar(project)"
                >{{ radarRingNames[project.radarRing] }}</span
              >
            </el-tooltip>
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
.toolbar-item {
  margin-left: 8px;
}
</style>
