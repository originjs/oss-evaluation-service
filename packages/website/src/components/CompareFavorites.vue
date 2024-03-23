<script setup lang="ts">
import { ArrowDown, ArrowUp, Picture, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { defineExpose } from 'vue';

enum PanelState {
  hide = 0,
  collapse = 1,
  expand = 2,
}
const emit = defineEmits(['compare']);

let projects: Array<{ repoName: string; logo: string; url: string; description: string }> =
  reactive(
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

function removeProject(project: {
  repoName: string;
  logo: string;
  url: string;
  description: string;
}) {
  let index = projects.findIndex(item => item.url === project.url);
  projects.splice(index, 1);
  localStorage.setItem('oss-evaluation-compare-projects', JSON.stringify(projects));
}

function cleanCompareFavorites() {
  projects.length = 0;
  localStorage.setItem('oss-evaluation-compare-projects', '[]');
}

function addProject(
  newProjects: Array<{ repoName: string; logo: string; url: string; description: string }>,
) {
  for (let project of newProjects) {
    let exists = projects.some(p => p.url === project.url);
    if (!exists) {
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
              <span class="project-name">{{ project.repoName }}</span>
              <span class="project-desc">{{ project.description }}</span>
            </div>
          </div>
          <div class="divider"></div>

          <Delete class="remove-btn" @click="removeProject(project)"></Delete>
        </div>

        <div v-for="idx in 5 - projects.length" :key="idx" class="project">
          <el-select style="width: 80%; margin-right: 10px" placeholder="选择开源软件"> </el-select>
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

            .project-name {
              height: 30px;
              overflow: hidden;
              text-overflow: ellipsis;
              font-weight: bolder;
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
