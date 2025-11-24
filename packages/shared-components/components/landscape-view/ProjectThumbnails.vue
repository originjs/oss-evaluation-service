<script setup lang="ts">
import { computed } from 'vue';
import GenerateProjectAvatar from './GenerateProjectAvatar.vue';
import type { Project } from './type';
import { RadarRing, radarRingColors } from './constant';

// 衰退期告警级别
enum RecessionRiskLevel {
  PENDING = 'PENDING',
  HIGH = '高',
  MID = '中',
  LOW = '低',
}

// 供应风险等级
enum SupplyRiskLevel {
  UNKNOWN = '未知',
  HIGH = '高',
  MID = '中',
  LOW = '低',
}

const props = defineProps<{
  project: Project;
  options?: {
    borderColor?: string | { [key: string]: string } | ((project: Project) => undefined | string);
    boxSize?: number;
    needBigSize?: boolean;
    labelFormat?: (project: Project) => string;
  };
}>();

const { project } = toRefs(props);
const options = computed(() => ({
  ...(props?.options || {}),
  boxSize: props.options?.boxSize ?? 40,
}));
const needBigSize = computed(
  () => options.value.needBigSize && project.value.radarRing === RadarRing.Adopt,
);
const boxSize = computed(() => {
  let boxSize = options!.value!.boxSize!;
  if (needBigSize.value) {
    boxSize *= 2;
  }
  return boxSize;
});

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
    } else if (options?.value?.borderColor['_default_']) {
      borderColor = options.value.borderColor['_default_'];
      hasBorder = true;
    }
  } else if (typeof options.value.borderColor === 'function') {
    const borderColorResult = options.value.borderColor(project.value);
    if (borderColorResult) {
      borderColor = borderColorResult;
      hasBorder = true;
    }
  }

  if (typeof project.value.radarRing === 'number' && project.value.radarRing in RadarRing) {
    borderColor = radarRingColors[project.value.radarRing];
    hasBorder = true;
  }

  if (needBigSize.value) {
    return {
      width: `${boxSize.value + 5}px`,
      height: `${boxSize.value + 5}px`,
      gridColumnEnd: 'span 2',
      gridRowEnd: 'span 2',
      border: `2px solid ${borderColor}`,
    };
  }

  const style: { [k in string]: string } = {
    width: `${boxSize.value}px`,
    height: `${boxSize.value}px`,
  };

  if (hasBorder) {
    style.border = `1px solid ${borderColor}`;
  }

  return style;
});

const hasFormatFn = typeof options?.value?.labelFormat === 'function';
const labelFormat = computed(() => {
  if (needBigSize.value && !hasFormatFn) {
    return project?.value?.name;
  }
  if (options?.value?.labelFormat) {
    return options.value.labelFormat(project!.value!);
  }
  return '';
});

// 计算并返回对应的风险背景颜色 class
const getRiskBgColor = computed(() => {
  const risk1 = props.project?.recessionRiskLevel;
  const risk2 = props.project?.supplyRiskLevel;

  // 定义风险等级的优先级，'高' > '中' > '低'，'PENDING' 和 '未知' 视为 '低'
  const getRiskPriority = (level: string | undefined): number => {
    if (level === RecessionRiskLevel.HIGH || level === SupplyRiskLevel.HIGH) return 3;
    if (level === RecessionRiskLevel.MID || level === SupplyRiskLevel.MID) return 2;
    return 1; // 默认视为低风险
  };

  const priority1 = getRiskPriority(risk1);
  const priority2 = getRiskPriority(risk2);

  const maxPriority = Math.max(priority1, priority2);

  if (maxPriority === 3) return 'bg-[var(--el-color-danger)]';
  if (maxPriority === 2) return 'bg-[var(--el-color-warning)]';
  return ''; // 低风险，不显示
});
</script>

<template>
  <div v-bind="$attrs" class="project-logo relative bg-white overflow-hidden" :style="projectStyle">
    <div class="w-full h-full flex flex-col items-center bg-white">
      <el-image
        class="w-full h-full flex flex-1 bg-white"
        loading="lazy"
        :src="project?.logo"
        fit="fill"
      >
        <template #error>
          <GenerateProjectAvatar v-model="project!.name" :width="boxSize" :height="boxSize" />
        </template>
        <template #placeholder>
          <div></div>
        </template>
      </el-image>
    </div>
    <span
      v-if="labelFormat && (needBigSize || hasFormatFn)"
      class="truncate bg-gray-200 h-20px lh-20px text-10px absolute text-center"
      :style="{
        width: `${needBigSize ? boxSize + 1 : options!.boxSize! - 2}px`,
        bottom: '0',
      }"
      >{{ labelFormat }}</span
    >
    <div
      v-if="getRiskBgColor"
      class="absolute top-0 right-0 w-4 h-4 transform translate-x-1/2 -translate-y-1/2 rotate-45"
      :class="getRiskBgColor"
    ></div>
  </div>
</template>
