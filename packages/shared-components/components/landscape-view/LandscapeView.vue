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
        <span
          class="landscape-category-name"
          style="transform: rotate(180deg)"
          write-vertical-right
          >{{ data.category }}</span
        >
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
            <span
              >{{ subData.subTechStackName }} ({{
                totalSubcategoryProjectsCount[`${data.category}###${subData.subTechStackName}`] ||
                0
              }})</span
            >
            <el-tooltip v-if="hasMore" effect="light" content="点击查看更多项目" placement="right">
              <div
                class="more-btn"
                i-custom:more
                font-size-4
                ml-2
                @click="gotoMore(data.category, subData.subTechStackName)"
              />
            </el-tooltip>
            <slot name="subTechStackTitleExtend" :subTechStack="subData"></slot>
          </div>
          <div
            :style="`display: grid;grid-template-columns: repeat(auto-fit,${boxSize}px);grid-auto-rows: ${boxSize}px;gap: ${boxGap}px;margin-bottom:10px;`"
          >
            <div
              v-for="project in subData.projects"
              :key="`${data.category}-${subData.subTechStackName}-${project.name}`"
              relative
              bg-white
              :style="`${getProjectStyle(project)} display: flex;word-wrap: break-word;`"
            >
              <div
                flex
                flex-col
                items-center
                bg-white
                class="project-logo"
                @click="clickProject(project)"
                @mouseenter="showProjectPopover(project, $event)"
                @mouseleave="hideProjectPopover"
              >
                <el-image
                  flex
                  flex-1
                  lazy
                  :src="project.logo"
                  bg-white
                  fit="fill"
                  :style="`width:${(project.bigProject === 'Y' ? boxSize * 2 : boxSize) - 2}px;height:${project.bigProject === 'Y' ? boxSize * 2 : boxSize}px;`"
                >
                  <template #error>
                    <GenerateProjectAvatar
                      v-model="project.name"
                      :width="project.bigProject === 'Y' ? boxSize * 2 : boxSize"
                      :height="project.bigProject === 'Y' ? boxSize * 2 : boxSize"
                    />
                  </template>
                  <template #placeholder>
                    <div></div>
                  </template>
                </el-image>
              </div>
              <span
                v-if="labelFormat(project) && (project.bigProject === 'Y' || hasLabel)"
                truncate
                bg-gray-200
                h-20px
                lh-20px
                text-10px
                :style="`width:${project.bigProject === 'Y' ? boxSize * 2 + 1 : boxSize - 2}px;bottom:0px;`"
                absolute
                text-center
                >{{ labelFormat(project) }}</span
              >
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
        <div flex items-center>
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

    <el-dialog v-model="isOpenProjectDialog" width="fit-content">
      <slot name="projectDialogHeader" :project="popoverProject">
        <div flex min-w-600px>
          <div class="project-logo" w-70px h-70px mr-10>
            <el-image :src="popoverProject?.logo" bg-white fit="fill">
              <template #error>
                <GenerateProjectAvatar v-model="popoverProject.name" :width="70" :height="70" />
              </template>
            </el-image>
          </div>
          <div class="project-info" flex flex-1 flex-col>
            <div flex>
              <span truncate text-lg fw-bold mr-3>
                {{ popoverProject?.name }}
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
                <el-tag type="warning" v-if="popoverProject?.language" effect="plain">
                  {{ popoverProject?.language }}
                </el-tag>
              </div>
            </div>
            <div>
              <el-text line-clamp="3" max-w-470px>
                {{ popoverProject?.description }}
              </el-text>
            </div>
            <div>
              <el-tag
                v-for="(label, idx) in popoverProject?.labels"
                :key="idx"
                :type="getTagType(idx)"
                mr-2
                mb-2
              >
                {{ label }}
              </el-tag>
            </div>
          </div>
        </div>
      </slot>
      <slot name="projectDialogBody" :project="popoverProject"> </slot>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { createPopper, type VirtualElement, type Instance } from '@popperjs/core';
import GenerateProjectAvatar from './GenerateProjectAvatar.vue';
import { getTagType } from '@orginjs/oss-evaluation-components-utils';

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
  labels: string[];
  language: string;
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
    colors: Array<string>;
    maxProjects?: number;
    labelFormat?: (project: Project) => string;
    hasMore?: boolean;
    enableProjectDialog?: boolean;
    enableProjectPopover: boolean;
    boxSize?: number; // || {width:number,height:number}
    boxGap?: number;
    borderColor?: string | { [key: string]: string };
    layout?: Layout;
    autoLayout?: AutoLayout;
    evaluation?: (project: Project) => void;
    goBenchmark?: (project: Project) => void;
  };
}>();

const emit = defineEmits<{
  (e: 'goMore', category: string, subTechStackName: string): void;
  (e: 'clickProject', project: Project): void;
}>();

const landcapseData = ref();
const popoverProject = ref<Project>({
  category: '',
  subcategory: '',
  name: '',
  description: '',
  htmlUrl: '',
  logo: '',
  starCount: 0,
  forksCount: 0,
  hasBenchmark: '',
  bigProject: '',
  labels: [],
  language: '',
});
const popoverRef = ref();
const hasMore = typeof props.options?.hasMore === 'undefined' ? true : props.options.hasMore;
const boxSize = typeof props.options?.boxSize !== 'number' ? 40 : props.options.boxSize;
const boxGap = typeof props.options?.boxGap !== 'number' ? 8 : props.options.boxGap;
const hasLabel = typeof props.options?.labelFormat === 'function' ? true : false;
const enableProjectPopover =
  typeof props.options?.enableProjectPopover === 'boolean'
    ? props.options?.enableProjectPopover
    : true;
let popoverInstance: Instance;
const isOpenProjectDialog = ref(false);
const totalSubcategoryProjectsCount = ref<{ [key: string]: number }>({});

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

type SubCategory = {
  subTechStackName: string;
  width?: number;
  normalizedProjectsCount?: number;
  hasBigProject?: boolean;
  projects: Array<Project>;
};

type LandscapeData = {
  category: string;
  subcategory: SubCategory[];
};

const getLandscapeWidth = () => {
  let width = (document.getElementById('landscape')?.offsetWidth || 1280) - 32;
  width = width < 350 ? 1248 : width;
  return width;
};

const DEFAULT_MAX_COLUMN = 2; // 默认一行展示的最大列数（子类别数）
const MIN_COLUMN_PROJECTS = 4; // 一列中至少要展示多少个项目数，用来计算最小列宽

// 计算 landscape 中每个子类别所占的宽度
const calcWidth: (data: LandscapeData[], autoLayout?: AutoLayout) => LandscapeData[] = (
  data,
  autoLayout,
) => {
  const width = getLandscapeWidth();
  for (const categoryData of data) {
    const maxCol = (autoLayout && autoLayout[categoryData.category]) || DEFAULT_MAX_COLUMN;
    const rowCount = Math.ceil(categoryData.subcategory.length / maxCol); // 根据最大列数计算得到子类别应该有几行
    let totalProjectsCount = 0;

    // 计算 projects 数量
    for (const subcategoryData of categoryData.subcategory) {
      let count = subcategoryData.projects.reduce((t, p) => (t += p.bigProject === 'Y' ? 2 : 1), 0); // 计算数量时 bigProjects 计为 2
      subcategoryData.normalizedProjectsCount = count; // 子类别中的项目数
      totalProjectsCount += count; // 所有子类别中的项目总数
    }

    // 按照 projects 数量排序
    categoryData.subcategory.sort((a, b) => b.normalizedProjectsCount - a.normalizedProjectsCount);

    // 生成行列信息，保存到 rows 中，列代表子类别
    const rows: (SubCategory & { weight: number })[][] = Array.from({ length: rowCount }, () => []);
    let currentRow = 0;
    for (const subcategoryData of categoryData.subcategory) {
      rows[currentRow].push({
        ...subcategoryData,
        width: 0,
        weight: subcategoryData.normalizedProjectsCount / totalProjectsCount, // 子类别的权重，等于 projects 数量 / projects 总数
      });
      currentRow = currentRow === rows.length - 1 ? 0 : currentRow + 1;
    }

    // 根据子类别所占的权重，计算得到其宽度
    for (const row of rows) {
      const rowWeights = row.reduce((t, s) => (t += s.weight), 0);
      for (const col of row) {
        col.width = width * (col.weight / rowWeights) - 10;
      }
    }

    // 调整子类别宽度不能小于最小宽度
    const minWidth = (MIN_COLUMN_PROJECTS - 1) * boxGap + MIN_COLUMN_PROJECTS * boxSize;
    for (const row of rows) {
      const owers = {};
      let owed = 0;

      // 把小于最小宽度的列设为最小宽度，记录下多出的宽度，需要从其他列减掉
      for (const col of row) {
        if (col.width < minWidth) {
          owed += minWidth - col.width;
          col.width = minWidth;
        } else {
          owers[col.subTechStackName] = col.width;
        }
      }

      // 如果有多出的宽度，需要减掉
      if (owed > 0) {
        const ownedPerRow = owed / Object.keys(owers).length; // 其他列应该减掉的宽度
        for (const col of row) {
          // 某些列减掉 ownedPerRow 后，会小于最小宽度，我们只把这些列减掉与最小宽度的差值
          if (Object.keys(owers).includes(col.subTechStackName)) {
            if (col.width - ownedPerRow < minWidth) {
              delete owers[col.subTechStackName];
              owed -= col.width - minWidth;
              col.width = minWidth;
            }
          }
        }

        for (const col of row) {
          if (Object.keys(owers).includes(col.subTechStackName)) {
            col.width -= owed / Object.keys(owers).length;
          }
        }
      }
    }

    categoryData.subcategory = rows.flat();
  }

  return data;
};

const countProjects = (item: Project) => {
  const key = `${item.category}###${item.subcategory}`;
  let currCount = totalSubcategoryProjectsCount.value[key] || 0;
  ++currCount;
  totalSubcategoryProjectsCount.value[key] = currCount;
};

const processLandscapeData = (
  projects: Project[],
  { layout, autoLayout, isInit }: { layout?: Layout; autoLayout?: AutoLayout; isInit?: boolean },
) => {
  let width = getLandscapeWidth();
  const indexMapping: { [key: string]: { index: number; subIndex: { [key: string]: number } } } =
    {};
  const _landcapseData: LandscapeData[] = [];
  const projectCategories = new Set(projects.map(p => p.category));
  const projectSubCategories = new Set(projects.map(p => p.subcategory));
  let category;
  let subcategory;
  let subcategoryArray;
  if (layout) {
    for (category in layout) {
      if (!projectCategories.has(category)) {
        continue;
      }

      indexMapping[category] = {
        index: _landcapseData.length,
        subIndex: {},
      };

      subcategoryArray = [];
      for (subcategory in layout[category]) {
        if (!projectSubCategories.has(subcategory)) {
          continue;
        }

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

  totalSubcategoryProjectsCount.value = {};
  projects.forEach((item: Project) => {
    countProjects(item);

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

  if (!layout || !isInit) {
    return calcWidth(_landcapseData, autoLayout);
  }

  return _landcapseData;
};

const initLandscape = () => {
  landcapseData.value = processLandscapeData(props.projects, {
    layout: props.options?.layout,
    autoLayout: props.options?.autoLayout,
    isInit: true,
  });
};

watch(
  () => props.projects,
  () => initLandscape(),
);

onMounted(() => {
  initLandscape();

  if (enableProjectPopover) {
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
  }
});

const updateProjects = (projects: Project[]) => {
  landcapseData.value = processLandscapeData(projects, {
    layout: props.options?.layout,
    autoLayout: props.options?.autoLayout,
  });
};

defineExpose({ updateProjects });

function gotoMore(category: string, subTechStackName: string) {
  emit('goMore', category, subTechStackName);
}

function clickProject(project: Project) {
  if (props.options?.enableProjectDialog) {
    isOpenProjectDialog.value = true;
  }
  emit('clickProject', project);
}

let timerNumber: NodeJS.Timeout;
const clearHideTimer = () => {
  clearTimeout(timerNumber);
};

const showProjectPopover = (project: Project, event: MouseEvent) => {
  clearHideTimer();
  popoverRef.value?.setAttribute('data-show', '');
  popoverProject.value = project;

  if (!enableProjectPopover) {
    return;
  }

  virtualElement.getBoundingClientRect = () => {
    return (event.target as Element)!.getBoundingClientRect();
  };
  popoverInstance.update();
};
const hideProjectPopover = () => {
  timerNumber = setTimeout(() => {
    popoverRef.value?.removeAttribute('data-show');
  }, 500);
};

function numberFormat(num: number) {
  if (num < 1000) {
    return num;
  }

  return (num / 1000).toFixed(1) + 'k';
}

const getProjectStyle = (project: Project) => {
  let borderColor = '#016bccb3';
  let hasBorder = false;
  if (typeof props.options?.borderColor === 'string') {
    borderColor = props.options?.borderColor;
    hasBorder = true;
  } else if (typeof props.options?.borderColor === 'object') {
    if (props.options?.borderColor[project.name]) {
      borderColor = props.options?.borderColor[project.name];
      hasBorder = true;
    } else if (project.bigProject == 'Y' && props.options?.borderColor['_bigProject_']) {
      borderColor = props.options?.borderColor['_bigProject_'];
    } else if (props.options?.borderColor['_default_']) {
      borderColor = props.options?.borderColor['_default_'];
      hasBorder = true;
    }
  }

  if (project.bigProject !== 'Y') {
    let style = `width: ${boxSize}px;height: ${boxSize}px;`;
    if (hasBorder) {
      style += `border: 1px solid ${borderColor};`;
    }
    return style;
  }

  return `width: ${boxSize * 2 + 5}px;height: ${boxSize * 2 + 5}px;grid-column-end: span 2;grid-row-end: span 2;border: 2px solid ${borderColor};`;
};

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
