<script setup lang="ts">
import { ArrowDown, ArrowUp, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { SoftwareBaseInfo, CompareProject } from '@orginjs/oss-evaluation-components-api';
import { SearchSoftware } from '../search-software';
import ProjectThumbnails from '../landscape-view/ProjectThumbnails.vue';
import type { Project } from '../landscape-view/type';
import { extractRepositoryName } from '@orginjs/oss-evaluation-components-utils';

const props = defineProps<{
  options?: {
    borderColor?: string | { [key: string]: string };
    boxSize?: number;
    labelFormat?: (project: Project) => string;
  };
}>();
const options = computed(() => ({
  ...(props?.options || {}),
  boxSize: props.options?.boxSize ?? 64,
  borderColor: props.options?.borderColor ?? '#e5e7eb',
  labelFormat: props.options?.labelFormat ?? (() => ''),
}));

enum PanelState {
  collapse = 1,
  expand = 2,
}
const emit = defineEmits(['compare']);

const projects: Array<CompareProject> = reactive(
  (() => {
    const projectsString = localStorage.getItem('oss-evaluation-compare-projects');
    if (projectsString) {
      return JSON.parse(projectsString);
    }
    return [];
  })(),
);

let panelState = ref<PanelState>(PanelState.collapse);

function removeProject(project: CompareProject) {
  let index = projects.findIndex(item => item.url === project.url);
  projects.splice(index, 1);
  localStorage.setItem('oss-evaluation-compare-projects', JSON.stringify(projects));
}

function cleanCompareFavorites() {
  projects.length = 0;
  localStorage.setItem('oss-evaluation-compare-projects', '[]');
}

const compatibleField = (p: any): CompareProject => {
  let project = { ...p };
  project.url = project.url || project.htmlUrl;
  if (!project.repoName && project.url) {
    project.repoName = extractRepositoryName(project.url);
  }
  return project;
};

function addProject(newProjects: Array<CompareProject>) {
  for (let p of newProjects) {
    let project = compatibleField(p);
    if (!project.repoName) {
      // TODO 如果不是 github 的项目，暂时不支持，待数据支持后这里的逻辑和 compatibleField 内的逻辑要改
      ElMessage.warning('暂无对比数据，无法添加');
      continue;
    }

    let exists = projects.some(p => p.url === project.url);
    if (exists) {
      ElMessage.success(`${project.repoName} 已添加`);
    } else {
      if (projects.length >= 5) {
        ElMessage.error('抱歉，最多只支持5款软件进行对比');
        break;
      }
      projects.push(project);
    }
  }
  localStorage.setItem('oss-evaluation-compare-projects', JSON.stringify(projects));
  expandPanel();
}

const onClickProject = async (software: SoftwareBaseInfo) => {
  addProject([software]);
};

function collapsePanel() {
  panelState.value = PanelState.collapse;
}

function expandPanel() {
  panelState.value = PanelState.expand;
}

function compare() {
  emit('compare', projects.slice());
  // todo:正式上线打开
  //cleanCompareFavorites();
}

function togglePanelVisible(visible?: boolean) {
  if (typeof visible === 'boolean') {
    visible ? expandPanel() : collapsePanel();
  } else if (panelState.value === PanelState.expand) {
    collapsePanel();
  } else {
    expandPanel();
  }
}

defineExpose({
  addProject,
  togglePanelVisible,
  cleanCompareFavorites,
});
</script>

<template>
  <div class="main">
    <div class="title-main">
      <span class="title" @click="togglePanelVisible()">
        <span>待对比软件</span>
        <el-icon>
          <ArrowDown v-if="panelState == PanelState.collapse" />
          <ArrowUp v-else />
        </el-icon>
      </span>
    </div>
    <div v-if="panelState == PanelState.expand" class="projects-main">
      <div class="projects">
        <div v-for="(project, idx) in projects" :key="idx" class="project">
          <div class="project-box">
            <project-thumbnails
              class="mr-14px"
              :project="project as unknown as Project"
              :options="{ ...options, needBigSize: false }"
            />
            <div class="project-info">
              <span>
                <el-link
                  :href="'/#/software-details?repoName=' + project.repoName"
                  target="_blank"
                  :underline="false"
                  :title="project.repoName"
                >
                  {{ project.repoName }}
                </el-link>
              </span>
              <span class="project-desc">{{ project.description }}</span>
            </div>
          </div>
          <div class="divider"></div>

          <Delete class="remove-btn hover-color-#F56C6C" @click="removeProject(project)"></Delete>
        </div>

        <div v-for="idx in 5 - projects.length" :key="idx" class="project" style="width: 200px">
          <SearchSoftware class="w-full pr-10px" @change="onClickProject">
            <button
              class="w-full flex flex-items-center p-12px rd-8px h-40px bg-#f6f6f7 b-1 b-solid b-transparent color-black-75 hover:b-#3451b2"
            >
              <span class="flex flex-items-center">
                <span i-ph-magnifying-glass-bold />
                <span class="ml-6px">添加软件对比</span>
              </span>
            </button>
          </SearchSoftware>
          <div class="divider"></div>
        </div>
      </div>
      <div class="operate">
        <el-button text @click="cleanCompareFavorites">清空对比栏</el-button>
        <el-button type="primary" @click="compare">对比</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.main {
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .title-main {
    height: 32px;
    width: 100%;
    border-bottom: 2px solid #79bbff;

    &:hover {
      border-color: #409eff;
    }

    .title {
      margin-left: 24px;
      padding: 2px 0 0 4px;
      width: 160px;
      height: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      background-color: #79bbff;
      clip-path: path('M 0 30 Q 20 30 25 15 Q 30 0 50 0 L 110 0 Q 130 0 135 15 Q 140 30 160 30');

      &:hover {
        background-color: #409eff;
      }

      .el-icon {
        margin-left: 4px;
      }
    }
  }

  .projects-main {
    display: flex;
    justify-content: center;
    height: 120px;
    background-color: white;

    .projects {
      display: flex;
      width: 1200px;

      .project {
        width: 240px;
        height: 100%;
        align-items: center;
        display: flex;
        padding: 0px 5px;
        position: relative;

        .project-box {
          display: flex;
          flex: 1;
          height: 100%;
          align-items: center;

          .project-info {
            display: flex;
            width: 150px;
            height: 100%;
            overflow: hidden;
            flex-direction: column;
            padding: 10px 10px 10px 0px;

            :deep(.el-link) {
              display: inline-block;
              width: 100%;

              .el-link__inner {
                display: inline-block;
                width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                font-weight: bolder;
                font-size: 16px;
                text-wrap: nowrap;
              }
            }

            .project-desc {
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 3;
              -webkit-box-orient: vertical;
            }
          }
        }

        .divider {
          border-left: 1px #ccc solid;
          height: 80%;
        }

        .remove-btn {
          width: 16px;
          height: 16px;
          position: absolute;
          right: 8px;
          bottom: 10px;
          cursor: pointer;
        }
      }
    }

    .operate {
      display: flex;
      flex-direction: column;
    }
  }
}
</style>
