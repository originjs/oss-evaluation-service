<template>
  <div id="landscape" w-full>
    <div v-for="(data, index) in landscapeData" :key="data.category" w-full flex mb-16px>
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
            :style="`background-color:${options.colors[index % options.colors.length]}`"
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
            <el-tooltip
              v-if="options.hasMore"
              effect="light"
              content="点击查看更多项目"
              placement="right"
            >
              <div
                class="more-btn i-custom:more font-size-4 ml-2"
                @click="gotoMore(data.category, subData.subTechStackName)"
              />
            </el-tooltip>
            <slot name="subTechStackTitleExtend" :sub-tech-stack="subData"></slot>
          </div>
          <div
            style="display: grid; margin-bottom: 10px"
            :style="{
              gridTemplateColumns: `repeat(auto-fit,${options.boxSize}px)`,
              gridAutoRows: `${options.boxSize}px`,
              gap: `${options.boxGap}px`,
            }"
          >
            <template v-if="options.enableProjectPopover">
              <el-popover
                v-for="project in subData.projects"
                :key="`${data.category}-${subData.subTechStackName}-${project.name}`"
                :show-after="options.popoverShowDelay"
                :hide-after="options.popoverHideDelay"
                :width="450"
                :teleported="false"
                :persistent="false"
                trigger="hover"
              >
                <template #reference>
                  <project-thumbnails
                    class="project-logo"
                    :project="project"
                    :options="options"
                    @click="clickProject(project)"
                  />
                </template>
                <project-popover :project="project" :options="options">
                  <template #toolbar-left>
                    <slot name="popover-toolbar-left" :project="project"></slot>
                  </template>
                  <template #toolbar-right>
                    <slot name="popover-toolbar-right" :project="project"></slot>
                  </template>
                </project-popover>
              </el-popover>
            </template>
            <template v-else>
              <project-thumbnails
                v-for="project in subData.projects"
                :key="`${data.category}-${subData.subTechStackName}-${project.name}`"
                class="project-logo"
                :project="project"
                :options="options"
                @click="clickProject(project)"
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="isOpenProjectDialog" width="fit-content">
      <slot name="projectDialogHeader" :project="dialogProject">
        <div flex min-w-600px>
          <div class="project-logo" w-70px h-70px mr-10>
            <el-image :src="dialogProject?.logo" bg-white fit="fill">
              <template #error>
                <GenerateProjectAvatar v-model="dialogProject.name" :width="70" :height="70" />
              </template>
            </el-image>
          </div>
          <div class="project-info" flex flex-1 flex-col>
            <div flex>
              <span truncate text-lg fw-bold mr-3>
                {{ dialogProject?.name }}
              </span>

              <div flex items-center>
                <div mr-3 flex items-center>
                  <span class="i-custom:star-active font-size-4 mr-1"></span>
                  {{ toKilo(dialogProject?.starCount, { fractionDigits: 1, emptyValue: '0' }) }}
                </div>
                <div mr-3 flex items-center>
                  <span class="i-custom:fork-active font-size-4 mr-1"></span>
                  {{ toKilo(dialogProject?.forksCount, { fractionDigits: 1, emptyValue: '0' }) }}
                </div>
                <a
                  :href="dialogProject?.htmlUrl"
                  target="_blank"
                  class="i-custom:github font-size-4 mr-3 cursor-pointer"
                ></a>
                <el-tag v-if="dialogProject?.language" type="warning" effect="plain">
                  {{ dialogProject?.language }}
                </el-tag>
              </div>
            </div>
            <div>
              <el-text line-clamp="3" max-w-470px>
                {{ dialogProject?.description }}
              </el-text>
            </div>
            <div>
              <el-tag
                v-for="(label, idx) in dialogProject?.labels"
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
      <slot name="projectDialogBody" :project="dialogProject"> </slot>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import GenerateProjectAvatar from './GenerateProjectAvatar.vue';
import { getTagType, toKilo } from '@orginjs/oss-evaluation-components-utils';
import ProjectPopover from './ProjectPopover.vue';
import type { Category, Subcategory } from './type';
import ProjectThumbnails from './ProjectThumbnails.vue';

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
    colors?: Array<string>;
    maxProjects?: number;
    labelFormat?: (project: Project) => string;
    hasMore?: boolean;
    enableProjectDialog?: boolean;
    enableProjectPopover?: boolean;
    popoverShowDelay?: number;
    popoverHideDelay?: number;
    boxSize?: number; // || {width:number,height:number}
    boxGap?: number;
    borderColor?: string | { [key: string]: string };
    layout?: Layout;
    autoLayout?: AutoLayout;
    evaluation?: (project: Project) => void;
    goBenchmark?: (project: Project) => void;
  };
}>();

const options = computed(() => ({
  ...(props?.options || {}),
  hasMore: props?.options?.hasMore ?? true,
  boxSize: props?.options?.boxSize ?? 40,
  boxGap: props?.options?.boxGap ?? 8,
  enableProjectPopover: props?.options?.enableProjectPopover ?? true,
  popoverShowDelay: props?.options?.popoverShowDelay ?? 0,
  popoverHideDelay: props?.options?.popoverHideDelay ?? 200,
  colors: props?.options?.colors ?? ['#89bff6', '#89c997', '#e8dd92', '#f0b58e', '#aea3db'],
}));

const emit = defineEmits<{
  (e: 'goMore', category: string, subTechStackName: string): void;
  (e: 'clickProject', project: Project): void;
}>();

const landscapeData = ref<Category[]>([]);
const dialogProject = ref<Project>({
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
const isOpenProjectDialog = ref(false);
const totalSubcategoryProjectsCount = ref<{ [key: string]: number }>({});

const getLandscapeWidth = () => {
  let width = (document.getElementById('landscape')?.offsetWidth || 1280) - 32;
  width = width < 350 ? 1248 : width;
  return width;
};

const DEFAULT_MAX_COLUMN = 2; // 默认一行展示的最大列数（子类别数）
const MIN_COLUMN_PROJECTS = 4; // 一列中至少要展示多少个项目数，用来计算最小列宽

// 计算 landscape 中每个子类别所占的宽度
const calcWidth: (data: Category[], autoLayout?: AutoLayout) => Category[] = (data, autoLayout) => {
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
    categoryData.subcategory.sort(
      (a, b) => b.normalizedProjectsCount! - a.normalizedProjectsCount!,
    );

    // 生成行列信息，保存到 rows 中，列代表子类别
    const rows: (Subcategory & { weight: number; width: number })[][] = Array.from(
      { length: rowCount },
      () => [],
    );
    let currentRow = 0;
    for (const subcategoryData of categoryData.subcategory) {
      rows[currentRow].push({
        ...subcategoryData,
        width: 0,
        weight: subcategoryData.normalizedProjectsCount! / totalProjectsCount, // 子类别的权重，等于 projects 数量 / projects 总数
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
    const minWidth =
      (MIN_COLUMN_PROJECTS - 1) * options.value.boxGap +
      MIN_COLUMN_PROJECTS * options.value.boxSize;
    for (const row of rows) {
      const owers: { [key: string]: number } = {};
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
  const _landscapeData: Category[] = [];
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
        index: _landscapeData.length,
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

      _landscapeData.push({ category: category, subcategory: subcategoryArray });
    }
  }

  totalSubcategoryProjectsCount.value = {};
  projects.forEach((item: Project) => {
    countProjects(item);

    if (typeof indexMapping[item.category] === 'undefined') {
      indexMapping[item.category] = {
        index: _landscapeData.length,
        subIndex: {},
      };
      _landscapeData.push({ category: item.category, subcategory: [] });
    }
    category = _landscapeData[indexMapping[item.category].index];

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

  _landscapeData.forEach(data => {
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
    return calcWidth(_landscapeData, autoLayout);
  }

  return _landscapeData;
};

const initLandscape = () => {
  landscapeData.value = processLandscapeData(props.projects, {
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
});

const updateProjects = (projects: Project[]) => {
  landscapeData.value = processLandscapeData(projects, {
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
    dialogProject.value = project;
    isOpenProjectDialog.value = true;
  }
  emit('clickProject', project);
}
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
</style>
