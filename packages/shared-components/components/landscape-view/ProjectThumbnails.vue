<script setup lang="ts">
import { computed } from 'vue';
import GenerateProjectAvatar from './GenerateProjectAvatar.vue';
import type { Project } from './type';

const props = defineProps<{
  project: Project;
  options?: {
    borderColor?: string | { [key: string]: string };
    boxSize?: number;
    labelFormat?: (project: Project) => string;
  };
}>();
const { project } = toRefs(props);
const options = computed(() => ({
  ...(props?.options || {}),
  boxSize: props.options?.boxSize ?? 40,
}));

const projectStyle = computed(() => {
  let borderColor = '#016bccb3';
  let hasBorder = false;
  if (typeof options?.value?.borderColor === 'string') {
    borderColor = options.value.borderColor;
    hasBorder = true;
  } else if (typeof options?.value?.borderColor === 'object') {
    if (options?.value?.borderColor[project?.value?.name]) {
      borderColor = options?.value?.borderColor[project?.value?.name];
      hasBorder = true;
    } else if (project?.value?.bigProject == 'Y' && options?.value?.borderColor['_bigProject_']) {
      borderColor = options.value.borderColor['_bigProject_'];
    } else if (options?.value?.borderColor['_default_']) {
      borderColor = options.value.borderColor['_default_'];
      hasBorder = true;
    }
  }

  if (project?.value?.bigProject !== 'Y') {
    let style: { [k in string]: string } = {
      width: `${options?.value?.boxSize}px`,
      height: `${options?.value?.boxSize}px`,
    };

    if (hasBorder) {
      style = {
        ...style,
        border: `1px solid ${borderColor}`,
      };
    }

    return style;
  }

  return {
    width: `${options!.value!.boxSize! * 2 + 5}px`,
    height: `${options!.value!.boxSize! * 2 + 5}px`,
    gridColumnEnd: 'span 2',
    gridRowEnd: 'span 2',
    border: `2px solid ${borderColor}`,
  };
});

const isBigProject = computed(() => project?.value?.bigProject === 'Y');
const boxSize = computed(() => {
  let boxSize = options!.value!.boxSize!;
  if (isBigProject.value) {
    boxSize *= 2;
  }
  return boxSize;
});

const hasFormatFn = typeof options?.value?.labelFormat === 'function';
const labelFormat = computed(() => {
  if (isBigProject.value && !hasFormatFn) {
    return project?.value?.name;
  }
  if (options?.value?.labelFormat) {
    return options.value.labelFormat(project!.value!);
  }
  return '';
});
</script>

<template>
  <div v-bind="$attrs" class="project-logo relative bg-white" :style="projectStyle">
    <div class="w-full h-full flex flex-col items-center bg-white">
      <el-image class="flex flex-1 bg-white" lazy :src="project?.logo" fit="fill">
        <template #error>
          <GenerateProjectAvatar v-model="project!.name" :width="boxSize" :height="boxSize" />
        </template>
        <template #placeholder>
          <div></div>
        </template>
      </el-image>
    </div>
    <span
      v-if="labelFormat && (isBigProject || hasFormatFn)"
      class="truncate bg-gray-200 h-20px lh-20px text-10px absolute text-center"
      :style="{
        width: `${isBigProject ? boxSize + 1 : options!.boxSize! - 2}px`,
        bottom: '0',
      }"
      >{{ labelFormat }}</span
    >
  </div>
</template>
