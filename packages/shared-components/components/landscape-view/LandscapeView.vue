<template>
  <div id="landscape" w-full>
    <div v-for="(data, index) in landcapseData" :key="data.category" w-full flex mb-16px>
      <div
        :style="`background-color:${getBackgroundColor(index)}`"
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
        <span style="transform: rotate(180deg)" write-vertical-right>{{ data.category }}</span>
      </div>
      <div flex-1 flex flex-wrap justify-between>
        <div
          v-for="subData in data.subcategory"
          :key="`${data.category}-${subData.subTechStackName}`"
          :style="`width: ${subData.width}px;`"
        >
          <div
            :style="`background-color:${getBackgroundColor(index)}`"
            h-32px
            rd-4px
            c-white
            text-14px
            flex
            justify-center
            items-center
            mb-10px
          >
            <span>{{ subData.subTechStackName }}</span>
            <el-tooltip v-if="hasMore" effect="light" content="点击查看更多项目" placement="right">
              <div
                class="more-btn"
                i-custom:more
                font-size-4
                ml-2
                @click="gotoMore(data.category, subData.subTechStackName)"
              />
            </el-tooltip>
          </div>
          <div
            :style="`display: grid;grid-template-columns: repeat(auto-fit,${boxSize}px);grid-auto-rows: ${boxSize}px;gap: 0.3em;margin-bottom:10px;`">
            <div v-for="project in subData.projects" relative
              :style="`${getProjectStyle(project)} display: flex;word-wrap: break-word;`"
              :key='`${data.category}-${subData.subTechStackName}-${project.name}`'>
              <div flex flex-col items-center bg-white class="project-logo" @click="clickProject(project)"
                @mouseenter="showProjectPopover(project, $event)" @mouseleave="hideProjectPopover">
                <el-image flex flex-1 lazy :src="'' + project.logo" bg-white fit="fill">
                  <template #error>
                    <GenerateProjectAvatar v-model="project.name" :width="project.bigProject === 'Y' ? boxSize * 2 : boxSize"
                      :height="project.bigProject === 'Y' ? boxSize * 2: boxSize" />
                  </template>
                </el-image>
              </div>
              <span v-if="labelFormat(project) && (project.bigProject === 'Y' || hasLabel)" truncate bg-gray-200 h-20px text-10px
                  :style="`width:${project.bigProject === 'Y' ? boxSize * 2 : boxSize}px;bottom:0px;`" absolute 
                  text-center>{{ labelFormat(project) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      id="project-tooltip"
      ref="popoverRef"
      w-450px
      bg-white
      role="project-tooltip"
      style="
        box-shadow:
          rgb(14 18 22 / 35%) 0px 10px 38px -10px,
          rgb(14 18 22 / 20%) 0px 10px 20px -15px;
        padding: 20px;
      "
      @mouseenter="clearHideTimer"
      @mouseleave="hideProjectPopover"
    >
      <div>
        <div flex>
          <div w-70px h-90px mr-3>
            <el-image :src="popoverProject?.logo" bg-white fit="fill">
              <template #error>
                <GenerateProjectAvatar v-model="popoverProject.name" :width="70" :height="70" />
              </template>
            </el-image>
          </div>
          <div flex flex-1 flex-col>
            <span text-lg fw-bold>
              <el-text line-clamp="2">
                {{ popoverProject?.name }}
              </el-text>
            </span>
            <div flex items-center>
              <div mr-3 flex items-center>
                <span i-custom:star-active font-size-4 mr-1></span>
                {{ numberFormat(popoverProject?.starCount || 0) }}
              </div>
              <div mr-3 flex items-center>
                <span i-custom:fork-active font-size-4 mr-1></span>
                {{ numberFormat(popoverProject?.forksCount || 0) }}
              </div>
              <a
                :href="popoverProject?.htmlUrl"
                target="_blank"
                i-custom:github
                font-size-4
                mr-3
                cursor-pointer
              ></a>
            </div>
          </div>
          <div flex>
            <div v-if="props.options?.evaluation" flex flex-col mr-3 items-center>
              <el-tooltip effect="light" content="先进性评估" placement="bottom">
                <span
                  i-custom:evaluation
                  font-size-10
                  cursor-pointer
                  @click="props.options?.evaluation(popoverProject as Project)"
                ></span>
              </el-tooltip>
            </div>
            <div v-if="popoverProject?.hasBenchmark == 'Y'" flex flex-col items-center>
              <el-tooltip effect="light" content="性能Benchmark" placement="bottom">
                <span
                  i-custom:benchmark
                  font-size-10
                  :class="{ 'cursor-pointer': props.options?.goBenchmark }"
                  @click="
                    props.options?.goBenchmark &&
                      props.options?.goBenchmark(popoverProject as Project)
                  "
                ></span>
              </el-tooltip>
            </div>
          </div>
        </div>
        <el-text line-clamp="3">
          {{ popoverProject?.description }}
        </el-text>
      </div>
      <div id="arrow" data-popper-arrow></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { createPopper, type VirtualElement, type Instance } from '@popperjs/core';
import GenerateProjectAvatar from './GenerateProjectAvatar.vue';

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
  bigProject: string;
}

const props = defineProps<{
  projects: Array<Project>;
  options?: {
    colors: Array<string>,
    maxProjects?: number,
    labelFormat?: (project: Project) => string,
    hasMore?: boolean,
    boxSize?: number,  // || {width:number,height:number}
    layout?: { [key: string]: any },
    evaluation?: (project: Project) => void,
    goBenchmark?: (project: Project) => void
  }
}>();

const emit = defineEmits<{
  (e: 'goMore', category: string, subTechStackName: string): void;
  (e: 'clickProject', project: Project): void;
}>();

const landcapseData = ref();
const popoverProject = ref<Project>(props.projects[0]);
const popoverRef = ref();
const hasMore = typeof props.options?.hasMore === 'undefined' ? true : props.options.hasMore;
const boxSize = typeof props.options?.boxSize !== 'number' ? 40 : props.options.boxSize;
const hasLabel = typeof props.options?.labelFormat === 'function' ? true : false;
let popoverInstance: Instance;

const BackgroundColors = ['#89bff6', '#89c997', '#e8dd92', '#f0b58e', '#aea3db'];
const getBackgroundColor = (index: number) => {
  let colors = BackgroundColors;
  if (props.options?.colors) {
    colors = props.options.colors;
  }
  return colors[index % colors.length];
};

const virtualElement: VirtualElement = {
  getBoundingClientRect: () => {
    return {
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    } as ClientRect;
  },
};

onMounted(() => {
  let width = document.getElementById('landscape')!.offsetWidth - 32;
  width = width < 350 ? 1248 : width;
  const indexMapping: { [key: string]: { index: number; subIndex: { [key: string]: number } } } =
    {};
  const _landcapseData: {
    category: string;
    subcategory: Array<{
      subTechStackName: string;
      width?: number;
      hasBigProject?: boolean;
      projects: Array<Project>;
    }>;
  }[] = [];
  let category;
  let subcategory;
  let subcategoryArray;
  const layout = props.options?.layout;
  if (layout) {
    for (category in layout) {
      indexMapping[category] = {
        index: _landcapseData.length,
        subIndex: {},
      };

      subcategoryArray = [];
      for (subcategory in layout[category]) {
        indexMapping[category].subIndex[subcategory] = subcategoryArray.length;
        subcategoryArray.push({
          subTechStackName: subcategory,
          hasBigProject: false,
          width: width * layout[category][subcategory] - 10,
          projects: [],
        });
      }

      _landcapseData.push({ category: category, subcategory: subcategoryArray });
    }
  }

  props.projects.forEach((item: Project) => {
    if (typeof indexMapping[item.category] === 'undefined') {
      indexMapping[item.category] = {
        index: _landcapseData.length,
        subIndex: {},
      };
      _landcapseData.push({ category: item.category, subcategory: [] });
    }
    category = _landcapseData[indexMapping[item.category].index];

    if (typeof indexMapping[item.category].subIndex[item.subcategory] === 'undefined') {
      indexMapping[item.category].subIndex[item.subcategory] = category.subcategory.length;
      category.subcategory.push({
        subTechStackName: item.subcategory,
        hasBigProject: false,
        projects: [],
      });
    }

    subcategory = category.subcategory[indexMapping[item.category].subIndex[item.subcategory]];

    if (!subcategory.hasBigProject && item.bigProject === 'Y') {
      subcategory.hasBigProject = true;
    }

    if (
      item.bigProject === 'Y' ||
      !props.options?.maxProjects ||
      subcategory.projects.length < props.options?.maxProjects
    ) {
      subcategory.projects.push(item);
    }
  });

  _landcapseData.forEach(data => {
    data.subcategory.forEach(subcategory => {
      if (!subcategory.hasBigProject) {
        return;
      }
      subcategory.projects.sort((p1, p2) => {
        if (p1.bigProject === 'Y' && p2.bigProject !== 'Y') {
          return -1;
        } else if (p1.bigProject !== 'Y' && p2.bigProject === 'Y') {
          return 1;
        } else {
          return 0;
        }
      });
    });
  });

  landcapseData.value = _landcapseData;

  popoverInstance = createPopper(virtualElement, popoverRef.value, {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 3],
        },
      },
    ],
  });
});

function gotoMore(category: string, subTechStackName: string) {
  emit('goMore', category, subTechStackName);
}

function clickProject(project: Project) {
  emit('clickProject', project);
}

let timerNumber: NodeJS.Timeout;
const clearHideTimer = () => {
  clearTimeout(timerNumber);
};

const showProjectPopover = (project: Project, event: MouseEvent) => {
  clearHideTimer();
  popoverRef.value.setAttribute('data-show', '');
  popoverProject.value = project;
  virtualElement.getBoundingClientRect = () => {
    return (event.target as Element)!.getBoundingClientRect();
  };
  popoverInstance.update();
};
const hideProjectPopover = () => {
  timerNumber = setTimeout(() => {
    popoverRef.value.removeAttribute('data-show');
  }, 500);
};

function numberFormat(num: number) {
  if (num < 1000) {
    return num;
  }

  return (num / 1000).toFixed(1) + 'k';
}

const getProjectStyle = (project: Project) => {
  if (project.bigProject !== 'Y') {
    return `width: ${boxSize}px;height: ${boxSize}px;`;
  }
  //40 * 2 + 5px gap
  return `width: ${boxSize * 2 + 5}px;height: ${boxSize * 2 + 5}px;grid-column-end: span 2;grid-row-end: span 2;border: 2px solid #016bccb3;`;
}

const labelFormat = (project: Project): string => {
  if (project.bigProject === 'Y' && !hasLabel) {
    return project.name;
  }
  if (props.options?.labelFormat) {
    return props.options.labelFormat(project);
  }
  return '';
};
</script>
<style scoped lang="less">
.project-logo {
  &:hover {
    cursor: pointer;
    box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.14);
  }
}

.more-btn {
  &:hover {
    cursor: pointer;
  }
}

#project-tooltip {
  display: none;

  #arrow,
  #arrow::before {
    position: absolute;
    width: 8px;
    height: 8px;
    background: inherit;
  }

  #arrow {
    visibility: hidden;
  }

  #arrow::before {
    visibility: visible;
    content: '';
    transform: rotate(45deg);
  }

  &[data-popper-placement^='top'] > #arrow {
    bottom: -4px;
  }

  &[data-popper-placement^='bottom'] > #arrow {
    top: -4px;
  }

  &[data-popper-placement^='left'] > #arrow {
    right: -4px;
  }

  &[data-popper-placement^='right'] > #arrow {
    left: -4px;
  }

  &[data-show] {
    display: block;
  }
}
</style>
