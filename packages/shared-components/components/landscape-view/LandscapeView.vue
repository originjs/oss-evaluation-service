<template>
  <div id="landscape" w-full>
    <div
      v-for="(categoryName, index) in Object.keys(landscapeData)"
      :key="categoryName"
      w-full
      flex
      mb-16px
    >
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
          >{{ categoryName }}</span
        >
      </div>
      <div flex-1 flex flex-wrap justify-between>
        <div
          v-for="subcategoryName in Object.keys(landscapeData[categoryName])"
          :key="`${categoryName}-${subcategoryName}`"
          :style="`width: ${landscapeData[categoryName][subcategoryName].width}px;`"
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
              >{{ subcategoryName }} ({{
                landscapeData[categoryName][subcategoryName].count || 0
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
                @click="gotoMore(categoryName, subcategoryName)"
              />
            </el-tooltip>
            <slot
              name="subTechStackTitleExtend"
              :sub-tech-stack="landscapeData[categoryName][subcategoryName]"
            ></slot>
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
              <project-popover
                v-for="project in landscapeData[categoryName][subcategoryName].projects"
                :key="`${categoryName}-${subcategoryName}-${project.name}`"
                :project="project"
                :options="options"
              >
                <template #reference>
                  <project-thumbnails
                    class="project-logo"
                    :project="project"
                    :options="options"
                    @click="clickProject(project)"
                  />
                </template>
                <template #toolbar-left>
                  <slot name="popover-toolbar-left" :project="project"></slot>
                </template>
                <template #toolbar-right>
                  <slot name="popover-toolbar-right" :project="project"></slot>
                </template>
              </project-popover>
            </template>
            <template v-else>
              <project-thumbnails
                v-for="project in landscapeData[categoryName][subcategoryName].projects"
                :key="`${categoryName}-${subcategoryName}-${project.name}`"
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
        <div flex min-w-600px class="project-dialog-header">
          <project-thumbnails
            v-if="isOpenProjectDialog"
            class="project-logo"
            :project="dialogProject"
            :options="{
              ...options,
              boxSize: 80,
            }"
            mr-4
            @click="emit('toDetailsPage', dialogProject)"
          />
          <div class="project-info" flex flex-1 flex-col>
            <div flex>
              <span
                truncate
                text-lg
                fw-bold
                mr-3
                cursor-pointer
                @click="emit('toDetailsPage', dialogProject)"
              >
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
              <el-tooltip
                v-for="(item, idx) in dialogProject?.osInfo || []"
                :key="idx"
                :content="`自 ${item.os} ${item.introduceVersion} 版本开始引入`"
                effect="light"
              >
                <el-tag :type="getSystemTagType(item.os)" mr-2 mb-2 class="tag-system">
                  <span
                    pr-6px
                    :style="{
                      'border-right': `1px solid var(--el-color-${getSystemTagType(item.os)}-light-7)`,
                    }"
                  >
                    {{ item.os }}
                  </span>
                  <span pl-6px>{{ item.introduceVersion }}</span>
                </el-tag>
              </el-tooltip>
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
import { getTagType, toKilo, getSystemTagType } from '@orginjs/oss-evaluation-components-utils';
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
  projectType?: string;
  osInfo?: Array<{
    os: string;
    introduceVersion: string;
  }>;
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
    borderColor?: string | { [key: string]: string };
    layout?: Layout;
    autoLayout?: AutoLayout;
    evaluation?: (project: Project) => void;
    goBenchmark?: (project: Project) => void;
    sortProject?: (p1: Project, p2: Project) => number;
  };
}>();

const options = computed(() => ({
  sortProject: (p1: Project, p2: Project) => p1.name.localeCompare(p2.name), // 默认按名称排序
  hasMore: true,
  boxSize: 40,
  boxGap: 8,
  enableProjectPopover: true,
  colors: ['#89bff6', '#89c997', '#e8dd92', '#f0b58e', '#aea3db'],
  ...props.options, // 用户自定义的配置，覆盖默认配置
}));

const emit = defineEmits<{
  (e: 'goMore', category: string, subTechStackName: string): void;
  (e: 'clickProject', project: Project): void;
  (e: 'toDetailsPage', project: Project, hash?: string): void;
}>();

const landscapeData = ref<Category>({});
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

const getLandscapeWidth = () => {
  let width = (document.getElementById('landscape')?.offsetWidth || 1280) - 32;
  width = width < 350 ? 1248 : width;
  return width;
};

const DEFAULT_MAX_COLUMN = 2; // 默认一行展示的最大列数（子类别数）
const MIN_COLUMN_PROJECTS = 4; // 一列中至少要展示多少个项目数，用来计算最小列宽

// 计算 landscape 中每个子类别所占的宽度
const calcWidth: (projects: Project[], category: Category, autoLayout?: AutoLayout) => Category = (
  projects,
  category,
  autoLayout,
) => {
  const width = getLandscapeWidth();
  for (const categoryName of Object.keys(category)) {
    const maxCol = (autoLayout && autoLayout[categoryName]) || DEFAULT_MAX_COLUMN;
    const rowCount = Math.ceil(Object.keys(category[categoryName]).length / maxCol); // 根据最大列数计算得到子类别应该有几行

    // 二维数组结构，保存行列信息，行代表当前大类别，列代表子类别
    const rows: (Subcategory & { weight: number; width: number })[][] = Array.from(
      { length: rowCount },
      () => [],
    );
    let rowIndex = 0;
    // 循环子类别，把信息填充到二维数组中
    for (const subcategoryName of Object.keys(category[categoryName])) {
      const subcategory = category[categoryName][subcategoryName];

      rows[rowIndex].push({
        ...subcategory,
        width: 0,
        weight: subcategory.displayCount / projects.length, // 子类别的权重，等于 projects 数量 / projects 总数
      });

      if (rows[rowIndex].length === maxCol) {
        // 当前行已满，换行
        rowIndex++;
      }
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

    // 把计算好的子类别宽度设置到 category 中
    for (const row of rows) {
      for (const col of row) {
        category[categoryName][col.subTechStackName] = col;
      }
    }
  }

  return category;
};

const processLandscapeData = (
  projects: Project[],
  { layout, autoLayout, isInit }: { layout?: Layout; autoLayout?: AutoLayout; isInit?: boolean },
): Category => {
  const width = getLandscapeWidth();
  const category: Category = {}; // 处理后的数据

  // 根据 layout 初始化 category
  if (layout) {
    for (const categoryName of Object.keys(layout)) {
      category[categoryName] = {};

      for (const subcategoryName of Object.keys(layout[categoryName])) {
        category[categoryName][subcategoryName] = {
          subTechStackName: subcategoryName,
          hasBigProject: false,
          projects: [],
          count: 0,
          displayCount: 0,
          width: width * layout[categoryName][subcategoryName] - 10,
        };
      }
    }
  }

  // 根据 projects 填充 category 数据
  projects.forEach(item => {
    // 初始化没有经过 layout 处理的类别数据
    if (!category[item.category]) {
      category[item.category] = {};
    }
    if (!category[item.category][item.subcategory]) {
      category[item.category][item.subcategory] = {
        subTechStackName: item.subcategory,
        hasBigProject: false,
        projects: [],
        count: 0,
        displayCount: 0,
        width: width - 10,
      };
    }

    const subcategory = category[item.category][item.subcategory];
    subcategory.count++; // 计算子类别项目总数

    const isBigProject = item.bigProject === 'Y';
    if (isBigProject) {
      // 当前子类别有大项目
      subcategory.hasBigProject = true;
    }

    if (
      isBigProject ||
      !props.options?.maxProjects ||
      subcategory.projects.length < props.options?.maxProjects
    ) {
      // 大项目 或者 还没有达到最大项目数才添加
      subcategory.projects.push(item);
      subcategory.displayCount++; // 计算子类别展示项目总数
    }
  });

  // 对填充完成的 category 数据进一步处理
  for (const categoryName of Object.keys(category)) {
    for (const subcategoryName of Object.keys(category[categoryName])) {
      const subcategory = category[categoryName][subcategoryName];
      if (!subcategory.projects.length) {
        // 删除没有项目的子类别
        delete category[categoryName][subcategoryName];
        continue;
      }

      // 先按 sortProject 排序项目；默认按名称排序
      subcategory.projects.sort(options.value.sortProject);

      if (!subcategory.hasBigProject) {
        continue;
      }

      // 再按 bigProject 排序项目
      subcategory.projects.sort((p1, p2) => {
        if (p1.bigProject === 'Y' && p2.bigProject !== 'Y') {
          return -1;
        } else if (p1.bigProject !== 'Y' && p2.bigProject === 'Y') {
          return 1;
        } else {
          return 0;
        }
      });
    }

    // 删除没有子类别的类别
    if (!Object.keys(category[categoryName]).length) {
      delete category[categoryName];
    }
  }

  if (!layout || !isInit) {
    return calcWidth(projects, category, autoLayout);
  }

  return category;
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

function toggleDialogVisible(visible?: boolean) {
  if (typeof visible === 'boolean') {
    isOpenProjectDialog.value = visible;
  } else {
    isOpenProjectDialog.value = !isOpenProjectDialog.value;
  }
}

defineExpose({
  updateProjects,
  toggleDialogVisible,
});

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
    box-shadow: 0 0 7px 0 rgba(0, 0, 0, 0.14);
  }
}

.more-btn {
  &:hover {
    cursor: pointer;
  }
}
#landscape {
  :deep(.el-dialog) {
    margin: 12px auto 0;
  }
}
.tag-system {
  span {
    display: inline-block;
    height: 22px;
    line-height: 22px;
  }
}
</style>
