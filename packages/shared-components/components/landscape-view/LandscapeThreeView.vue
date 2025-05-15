<template>
  <div w-full>
    <div v-for="(name, index) in Object.keys(thirdViewData)" :key="name" w-full flex mb-16px>
      <div
        :style="`background-color:${options.colors[index % options.colors.length]}`"
        w-32px
        rd-4px
        c-white
        text-14px
        min-h-100px
        flex
        justify-center
        items-center
        mr-16px
      >
        <span
          class="landscape-category-name"
          style="transform: rotate(180deg)"
          write-vertical-right
          >{{ name }}</span
        >
      </div>
      <LandscapeView
        ref="landscapeRef"
        style="width: calc(100% - 48px)"
        :projects="thirdViewData[name]"
        :options="options"
        :bg-color="options.colors[index % options.colors.length]"
        @click-project="project => emit('clickProject', project)"
        @go-more="(category, subTechStackName) => emit('goMore', category, subTechStackName)"
        @to-details-page="(project, hash) => emit('toDetailsPage', project, hash)"
      >
        <template #subTechStackTitleExtend="{ subTechStack }">
          <slot name="subTechStackTitleExtend" :sub-tech-stack="subTechStack"></slot>
        </template>
        <template #popover-toolbar-left="{ project }">
          <slot name="popover-toolbar-left" :project="project"></slot>
        </template>
        <template #popover-toolbar-right="{ project }">
          <slot name="popover-toolbar-right" :project="project"></slot>
        </template>
        <template #projectDialogHeader="{ project }">
          <slot name="projectDialogHeader" :project="project"></slot>
        </template>
        <template #projectDialogBody="{ project }">
          <slot name="projectDialogBody" :project="project"></slot>
        </template>
      </LandscapeView>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { RadarRing } from './constant';
import { LandscapeView } from './index';

interface Project {
  category: string;
  subcategory: string;
  name: string;
  description: string;
  htmlUrl: string;
  logo: string;
  starCount: number;
  forksCount: number;
  hasBenchmark: string;
  labels: string[];
  language: string;
  projectType?: string;
  osInfo?: Array<{
    os: string;
    introduceVersion: string;
  }>;
  radarRing?: RadarRing;
}

type Layout = {
  [key: string]: {
    [key: string]: number; // 设定每个子类所占的列宽，相加超过1就会在下一行显示
  };
};

type AutoLayout = {
  [key: string]: number; // 设定一行中可以有多少列子类，用于自动布局计算。默认为 2 列
};

const props = defineProps<{
  projects: Array<Project>;
  options?: {
    colors?: Array<string>;
    maxProjects?: number;
    labelFormat?: (project: Project) => string;
    hasMore?: boolean;
    enableProjectDialog?: boolean;
    enableProjectPopover?: boolean;
    boxSize?: number; // || {width:number,height:number}
    boxGap?: number;
    borderColor?: string | { [key: string]: string } | ((project: Project) => undefined | string);
    layout?: Layout;
    autoLayout?: AutoLayout; // 设定一行中可以有多少列子类，用于自动布局计算，默认为 3 列
    autoLayoutMaxCol?: number; // 如果没有配置 autoLayout 或类别不在 autoLayout 中，则使用该默认值 3 列
    evaluation?: (project: Project) => void;
    goBenchmark?: (project: Project) => void;
    sortProject?: (p1: Project, p2: Project) => number;
    toTechRadar?: (project: Project) => void;
    addProjectToCompare?: (project: Project) => void;
    needBigSize?: boolean;
  };
}>();
const landscapeRef = ref();
const options = computed(() => ({
  colors: ['#89bff6', '#89c997', '#e8dd92', '#f0b58e', '#aea3db'],
  ...props.options,
}));

const emit = defineEmits<{
  (e: 'goMore', category: string, subTechStackName: string): void;
  (e: 'clickProject', project: Project): void;
  (e: 'toDetailsPage', project: Project, hash?: string): void;
}>();

const thirdViewData = ref<{ [key: string]: Project[] }>({});

function processThirdViewData(projects: Project[]) {
  const res = {};
  if (options.value.layout) {
    Object.keys(options.value.layout).forEach(key => {
      res[key] = [];
    });
  }
  projects.forEach(project => {
    if (!res[project.category]) {
      res[project.category] = [];
    }
    res[project.category].push({
      ...project,
      rootCategory: project.category,
      category: project.subcategory,
      subcategory: project.labels[0] || project.subcategory,
    });
  });
  Object.keys(res).forEach(key => {
    if (!res[key].length) {
      delete res[key];
    }
  });
  return res;
}

const initLandscape = () => {
  thirdViewData.value = processThirdViewData(props.projects);
};

watch(
  () => props.projects,
  () => initLandscape(),
);

onMounted(() => {
  initLandscape();
});

const updateProjects = (projects: Project[]) => {
  thirdViewData.value = processThirdViewData(projects);
};

function toggleDialogVisible() {
  landscapeRef.value.forEach(target => {
    target.toggleDialogVisible(false);
  });
}

defineExpose({
  updateProjects,
  toggleDialogVisible,
});
</script>

<style scoped lang="less">
:deep(:nth-last-child(1 of .category-wrap)) {
  margin-bottom: 0;
}
</style>
