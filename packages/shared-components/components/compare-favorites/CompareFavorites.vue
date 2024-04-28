<script setup lang="ts">
import { ArrowDown, ArrowUp, Picture, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { SoftwareBaseInfo } from '@orginjs/oss-evaluation-components-api';
import { SearchSoftware } from '../search-software';

enum PanelState {
  hide = 0,
  collapse = 1,
  expand = 2,
}
const emit = defineEmits(['compare']);

const projects: Array<SoftwareBaseInfo> = reactive(
  (() => {
    const projectsString = localStorage.getItem('oss-evaluation-compare-projects');
    if (projectsString) {
      return JSON.parse(projectsString);
    }
    return [];
  })(),
);

const getPanelState = () => {
  if (!projects.length) {
    return PanelState.hide;
  }
  const state = localStorage.getItem('oss-evaluation-compare-panel-state');
  if (state) {
    return Number(state);
  }
  return PanelState.expand;
};

let panelState = ref<PanelState>(getPanelState());

const calcPanelState = () => {
  panelState.value = getPanelState();
};

function removeProject(project: SoftwareBaseInfo) {
  let index = projects.findIndex(item => item.url === project.url);
  projects.splice(index, 1);
  localStorage.setItem('oss-evaluation-compare-projects', JSON.stringify(projects));
}

function cleanCompareFavorites() {
  projects.length = 0;
  localStorage.setItem('oss-evaluation-compare-projects', '[]');
}

function addProject(newProjects: Array<SoftwareBaseInfo>) {
  for (let project of newProjects) {
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
  localStorage.setItem('oss-evaluation-compare-panel-state', String(PanelState.collapse));
  calcPanelState(); // 如何没有项目了，直接隐藏不收缩了
}

function expandPanel() {
  panelState.value = PanelState.expand;
  localStorage.setItem('oss-evaluation-compare-panel-state', String(PanelState.expand));
}

function compare() {
  emit('compare', projects.slice());
  // todo:正式上线打开
  //cleanCompareFavorites();
}

defineExpose({ addProject });
</script>

<template>
  <div v-if="panelState !== PanelState.hide" class="main">
    <div class="title-main">
      <div class="title-name-div">
        <span class="title">待对比软件</span>
        <el-button
          v-if="panelState == PanelState.expand"
          text
          :icon="ArrowDown"
          size="small"
          @click="collapsePanel"
          >隐藏</el-button
        >
        <el-button
          v-if="panelState == PanelState.collapse"
          text
          :icon="ArrowUp"
          size="small"
          @click="expandPanel"
          >显示</el-button
        >
      </div>
    </div>
    <div v-if="panelState == PanelState.expand" class="projects-main">
      <div class="projects">
        <div v-for="(project, idx) in projects" :key="idx" class="project">
          <div class="project-box">
            <div class="project-logo">
              <el-image :src="project.logo" fit="contain" class="w-64px h-64px mr-14px">
                <template #error>
                  <div flex flex-justify-center flex-items-center w-full h-full bg-gray-100>
                    <el-icon font-size-7 color-gray-400>
                      <Picture />
                    </el-icon>
                  </div>
                </template>
              </el-image>
            </div>
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
  background-color: white;
  border-top: 2px solid #79bbff;
  flex-direction: column;
  display: flex;
  overflow: hidden;

  .title-main {
    height: 30px;
    background-color: #dfe2e5;
    width: 100%;
    display: flex;
    justify-content: center;

    .title-name-div {
      width: 1280px;
      height: 100%;
      display: flex;
      align-items: center;

      .title {
        height: 100%;
        line-height: 30px;
        padding: 0px 15px;
        background-color: #79bbff;
        display: inline-block;
        color: white;
        margin-right: 5px;
      }
    }
  }

  .projects-main {
    display: flex;
    justify-content: center;
    height: 120px;

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

          .project-logo {
            display: flex;
            width: 80px;
            height: 100%;
            align-items: center;
          }

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
              flex: 1;
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
