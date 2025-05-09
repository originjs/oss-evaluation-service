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
      <div style="width: calc(100% - 48px)">
        <div
          v-for="level2 in Object.keys(landscapeData[categoryName])"
          :key="`${categoryName}-${level2}`"
          class="level2-wrap"
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
              >{{ level2 }}</span
            >
          </div>
          <div flex-1 flex flex-wrap justify-between>
            <div
              v-for="subcategoryName in Object.keys(landscapeData[categoryName][level2])"
              :key="`${categoryName}-${level2}-${subcategoryName}`"
              :style="`width: ${landscapeData[categoryName][level2][subcategoryName].width}px;`"
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
                    landscapeData[categoryName][level2][subcategoryName].count || 0
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
                    @click="gotoMore(categoryName, level2)"
                  />
                </el-tooltip>
                <slot
                  name="subTechStackTitleExtend"
                  :sub-tech-stack="landscapeData[categoryName][level2][subcategoryName]"
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
                    v-for="(project, pIndex) in landscapeData[categoryName][level2][subcategoryName]
                      .projects"
                    :key="`${categoryName}-${level2}-${subcategoryName}-${project.name}-${pIndex}`"
                    :project="project"
                    :options="options"
                  >
                    <template #reference>
                      <project-thumbnails
                        class="project-logo"
                        :project="project"
                        :options="{ ...options, needBigSize: options.needBigSize ?? true }"
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
                    v-for="(project, pIndex) in landscapeData[categoryName][level2][subcategoryName]
                      .projects"
                    :key="`${categoryName}-${level2}-${subcategoryName}-${project.name}-${pIndex}`"
                    class="project-logo"
                    :project="project"
                    :options="{ ...options, needBigSize: options.needBigSize ?? true }"
                    @click="clickProject(project)"
                  />
                </template>
              </div>
            </div>
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
              needBigSize: false,
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
      <slot name="projectDialogBody" :project="dialogProject"></slot>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getTagType, toKilo, getSystemTagType } from '@orginjs/oss-evaluation-components-utils';
import ProjectPopover from './ProjectPopover.vue';
import type { ThirdCategory } from './type';
import ProjectThumbnails from './ProjectThumbnails.vue';
import { RadarRing } from './constant';

type Category = Record<string, Record<string, Record<string, ThirdCategory>>>;

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

const options = computed(() => ({
  sortProject: (p1: Project, p2: Project) => p1.name.localeCompare(p2.name), // 默认按名称排序
  autoLayoutMaxCol: 3,
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
  labels: [],
  language: '',
});
const isOpenProjectDialog = ref(false);

const getLandscapeWidth = () => {
  let width = (document.getElementById('landscape')?.offsetWidth || 1280) - 82;
  width = width < 350 ? 1198 : width;
  return width;
};

const MIN_COLUMN_PROJECTS = 4; // 一列中至少要展示多少个项目数，用来计算最小列宽

// 对于没有使用 layout 设置宽度的子类别，根据 maxCol + 权重 计算子类别宽度
const calcWidth = (category: Category, calcCategory: Category) => {
  const layout = options.value.layout;
  const autoLayout = options.value.autoLayout;
  const width = getLandscapeWidth();

  // 只处理需要计算宽度的类别
  for (const calcCategoryName of Object.keys(calcCategory)) {
    const maxCol = autoLayout?.[calcCategoryName] || options.value.autoLayoutMaxCol;
    for (const level2 of Object.keys(calcCategory[calcCategoryName])) {
      const calcSubcategoryNames = Object.keys(calcCategory[calcCategoryName][level2]);
      const calcCategoryCount = calcSubcategoryNames.length;
      const rowCount = Math.ceil(calcCategoryCount / maxCol); // 根据最大列数计算得到子类别应该有几行

      // 二维数组结构，保存行列信息，行代表当前大类别，列代表子类别
      const rows: (ThirdCategory & { weight: number; width: number })[][] = Array.from(
        { length: rowCount },
        () => [],
      );
      let rowIndex = 0;
      // 循环子类别，把信息填充到二维数组中
      for (const level3 of calcSubcategoryNames) {
        const calcSubcategory = calcCategory[calcCategoryName][level2][level3];

        rows[rowIndex].push({
          ...calcSubcategory,
          width: 0,
          weight: calcSubcategory.displayCount / calcCategoryCount, // 子类别的权重，等于子类别总数 / 类别总数
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
            owers[col.level3] = col.width;
          }
        }

        // 如果有多出的宽度，需要减掉
        if (owed > 0) {
          const ownedPerRow = owed / Object.keys(owers).length; // 其他列应该减掉的宽度
          for (const col of row) {
            // 某些列减掉 ownedPerRow 后，会小于最小宽度，我们只把这些列减掉与最小宽度的差值
            if (Object.keys(owers).includes(col.level3)) {
              if (col.width - ownedPerRow < minWidth) {
                delete owers[col.level3];
                owed -= col.width - minWidth;
                col.width = minWidth;
              }
            }
          }

          for (const col of row) {
            if (Object.keys(owers).includes(col.level3)) {
              col.width -= owed / Object.keys(owers).length;
            }
          }
        }
      }

      // 手动配置过类别宽度的类别，这里用 category 而不用 layout 是因为 layout 可能存在多余的类别，category 中多余的类别已经被清理掉了
      const subcategoryNames = Object.keys(category[calcCategoryName][level2]).filter(
        key => !calcSubcategoryNames.includes(key),
      );
      // 最后一个手动配置宽度的子类别，以此为界，需要另起一行
      const lastSubcategoryName = subcategoryNames[subcategoryNames.length - 1];
      // 在设置宽度之前，如果有手动配置过类别宽度，需要确保自动计算的类别另起一行。否则会导致布局错乱
      if (layout && lastSubcategoryName) {
        // 计算手动配置的子类别宽度百分比的和，如果存在小数，说明未占满一行
        const categoryTotalWidth = subcategoryNames.reduce(
          // 这里用 layout 取值，是因为 layout 传的是宽度百分比，category 中的 width 是真实的宽度，用百分比方便计算
          (total, key) => (total += layout[calcCategoryName][level2][key]),
          0,
        );
        const decimalPart = categoryTotalWidth - Math.floor(categoryTotalWidth); // 取小数部分，即未占满一行的宽度
        if (decimalPart) {
          // 未占满一行，则把 layout 设置的类别中的最后一个子类别的宽度占满一行
          const originalWidthRate = layout[calcCategoryName][level2][lastSubcategoryName];
          const restWidthRate = 1 - decimalPart;
          let widthRate = originalWidthRate + restWidthRate;
          widthRate = widthRate > 1 ? 1 : widthRate;
          category[calcCategoryName][level2][lastSubcategoryName].width = width * widthRate - 10;
        }
      }

      // 把计算好的子类别宽度设置到 category 中
      for (const row of rows) {
        for (const col of row) {
          category[calcCategoryName][level2][col.level3] = col;
        }
      }
    }
  }

  return category;
};

const processLandscapeData = (projects: Project[], isInit?: boolean) => {
  const layout = options.value.layout;
  const width = getLandscapeWidth();
  const category: Category = {}; // 处理后的数据
  const calcCategory: Category = {}; // 需要计算宽度的类别

  // 根据 layout 初始化 category。先初始化再处理数据是为了保持界面显示的类别顺序与 layout 中配置的顺序一致
  if (layout) {
    for (const level1Name of Object.keys(layout)) {
      category[level1Name] = {};

      for (const level2Name of Object.keys(layout[level1Name])) {
        category[level1Name][level2Name] = {};

        for (const level3Name of Object.keys(layout[level1Name][level2Name])) {
          let widthRate = layout[level1Name][level2Name][level3Name];
          widthRate = !widthRate || widthRate > 1 ? 1 : widthRate; // 为 0 或 大于 1 的情况，设定为 1
          category[level1Name][level2Name][level3Name] = {
            subTechStackName: level2Name,
            level3: level3Name,
            isRadarRingAdopt: false,
            projects: [],
            count: 0,
            displayCount: 0,
            width: width * widthRate - 10,
          };
        }
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
      category[item.category][item.subcategory] = {};
    }
    const level3 = item.labels[0] || '未分类';

    if (!category[item.category][item.subcategory][level3]) {
      category[item.category][item.subcategory][level3] = {
        subTechStackName: item.subcategory,
        level3,
        isRadarRingAdopt: false,
        projects: [],
        count: 0,
        displayCount: 0,
        width: width - 10,
      };

      // 记录需要计算宽度的类别
      if (!calcCategory[item.category]) {
        calcCategory[item.category] = {};
      }
      if (!calcCategory[item.category][item.subcategory]) {
        calcCategory[item.category][item.subcategory] = {};
      }
      calcCategory[item.category][item.subcategory][level3] =
        category[item.category][item.subcategory][level3];
    }

    const subcategory = category[item.category][item.subcategory][level3];
    subcategory.count++; // 计算子类别项目总数

    const isRadarRingAdopt = item.radarRing === RadarRing.Adopt;
    if (isRadarRingAdopt) {
      // 当前子类别技术雷达指标值为【优选】的项目
      subcategory.isRadarRingAdopt = true;
    }

    if (
      isRadarRingAdopt ||
      !options.value.maxProjects ||
      subcategory.projects.length < options.value.maxProjects
    ) {
      // 大项目 或者 还没有达到最大项目数才添加
      subcategory.projects.push(item);
      subcategory.displayCount++; // 计算子类别展示项目总数
    }
  });

  // 对填充完成的 category 数据进一步处理
  for (const categoryName of Object.keys(category)) {
    for (const subcategoryName of Object.keys(category[categoryName])) {
      for (const level3Name of Object.keys(category[categoryName][subcategoryName])) {
        const subcategory = category[categoryName][subcategoryName][level3Name];
        if (!subcategory.projects.length) {
          // 删除没有项目的子类别
          delete category[categoryName][subcategoryName][level3Name];
          continue;
        }

        // 先按 sortProject 排序项目；默认按名称排序
        subcategory.projects.sort(options.value.sortProject);

        if (!subcategory.isRadarRingAdopt) {
          continue;
        }

        // 再按 isRadarRingAdopt 排序项目
        subcategory.projects.sort((p1, p2) => {
          if (p1.radarRing === RadarRing.Adopt && p2.radarRing !== RadarRing.Adopt) {
            return -1;
          } else if (p1.radarRing !== RadarRing.Adopt && p2.radarRing === RadarRing.Adopt) {
            return 1;
          } else {
            return 0;
          }
        });
      }
      if (!Object.keys(category[categoryName][subcategoryName]).length) {
        delete category[categoryName][subcategoryName];
      }
    }
    // 删除没有子类别的类别
    if (!Object.keys(category[categoryName]).length) {
      delete category[categoryName];
    }
  }

  // 如果不是第一次渲染，则是过滤后的结果，为了不影响布局，需要使用 category，即全部类别都需要计算宽度
  return calcWidth(category, isInit ? calcCategory : category);
};

const initLandscape = () => {
  landscapeData.value = processLandscapeData(props.projects, true);
};

watch(
  () => props.projects,
  () => initLandscape(),
);

onMounted(() => {
  initLandscape();
});

const updateProjects = (projects: Project[]) => {
  landscapeData.value = processLandscapeData(projects);
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
  if (options.value.enableProjectDialog) {
    dialogProject.value = project;
    isOpenProjectDialog.value = true;
  }
  emit('clickProject', project);
}
</script>

<style scoped lang="less">
.level2-wrap:last-child {
  margin-bottom: 0;
}

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
