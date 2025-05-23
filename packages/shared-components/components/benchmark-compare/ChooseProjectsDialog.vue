<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import type { SoftwareBaseInfo } from '@orginjs/oss-evaluation-components-api';
import { Search } from '@element-plus/icons-vue';

const props = defineProps<{
  projectsRaw: SoftwareBaseInfo[];
}>();
const { projectsRaw } = toRefs(props);

const projects = defineModel<SoftwareBaseInfo[]>('projects', { required: true });

const onlyShowHasBenchmark = ref(true);
const searchKeyWord = ref('');
const showProjects = computed<SoftwareBaseInfo[]>(() => {
  return projectsRaw.value
    .filter(project => (onlyShowHasBenchmark.value ? project.version : true))
    .filter(project => project.repoName?.toLowerCase().includes(searchKeyWord.value.toLowerCase()));
});

const findProjectIndex = (pId?: string) => {
  return projects.value.findIndex(project => project.pId === pId);
};

const chooseProject = (project: SoftwareBaseInfo) => {
  if (!project.version) {
    ElMessage.warning('系统缺少评测数据，你可以提交评测申请，我们会尽快处理。');
    return;
  }

  const index = findProjectIndex(project.pId);
  if (index === -1 && !project.selectedVersions.length) {
    ElMessage.warning('至少选择一个版本');
    return;
  }

  if (index === -1) {
    projects.value.push(project);
  } else {
    projects.value.splice(index, 1);
  }
};

const isSelectedAll = ref(true);
const selectAll = () => {
  if (!isSelectedAll.value) {
    projects.value = [];
  }

  for (const project of showProjects.value) {
    if (!project.version) {
      continue;
    }
    if (project.selectedVersions.length === 0) {
      project.selectedVersions.push(project.versionList[0]);
    }
    projects.value.push(project);
  }
};

const changeSelectedVersion = (project: SoftwareBaseInfo) => {
  if (!project.selectedVersions.length) {
    projects.value.splice(findProjectIndex(project.pId), 1);
  }
};
</script>

<template>
  <el-dialog class="choose-projects-dialog" style="min-width: 900px">
    <template #header>
      <div flex flex-items-center>
        <h4 font-size-18px fw-400 mr-20px>选择要显示的软件</h4>
        <el-checkbox v-model="isSelectedAll" label="全选" @change="selectAll" />
        <el-checkbox v-model="onlyShowHasBenchmark" label="仅显示有评测数据的软件" />
        <el-input
          v-model="searchKeyWord"
          :prefix-icon="Search"
          class="ml-2"
          style="width: 180px"
          size="small"
          placeholder="请输入软件名称"
        />
        <div ml-20px flex flex-items-center>开源软件总数：{{ showProjects?.length }}</div>
      </div>
    </template>
    <div overflow-y-scroll h-lg>
      <div
        v-for="item in showProjects"
        :key="item.pId"
        flex
        items-center
        h-80px
        class="project"
        :class="{
          selected: findProjectIndex(item.pId) !== -1,
          disable: !item.version,
        }"
        @click="chooseProject(item)"
      >
        <el-image :src="item.logo" fit="contain" class="w-64px h-64px mr-14px">
          <template #error>
            <div flex flex-justify-center flex-items-center w-full h-full bg-gray-100>
              <el-icon font-size-7 color-gray-400>
                <Picture />
              </el-icon>
            </div>
          </template>
        </el-image>
        <div flex flex-col flex-1>
          <div flex items-center justify-between>
            <div flex>
              <b mr-12px font-size-18px>{{ item.repoName }}</b>
              <span mr-4 flex items-center>
                <span i-custom:star font-size-5 mr-1></span>
                {{ item.star }}
              </span>
              <span mr-4 flex items-center>
                <span i-custom:fork font-size-5 mr-1></span>
                {{ item.forksCount }}
              </span>
            </div>
            <div flex>
              <span mr-4 flex items-center>
                <el-select
                  v-model="item.selectedVersions"
                  placeholder="选择版本"
                  size="small"
                  collapse-tags
                  collapse-tags-tooltip
                  style="width: 220px"
                  multiple
                  @change="changeSelectedVersion(item)"
                >
                  <template #header>
                    <el-button text type="primary">申请其他版本</el-button>
                  </template>
                  <el-option
                    v-for="version in item.versionList"
                    :key="version"
                    :label="version"
                    :value="version"
                  />
                </el-select>
              </span>
            </div>
          </div>
          <el-text line-clamp="2" class="w-full">
            {{ item.description }}
          </el-text>
        </div>
        <div
          v-if="findProjectIndex(item.pId) !== -1"
          i-custom:choose
          font-size-12
          position-absolute
          pos-bottom-0px
          pos-right-0px
        ></div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="less">
.choose-projects-dialog {
  .project {
    border: 1px solid #ccc;
    padding: 0 10px;
    margin-bottom: 5px;
    position: relative;

    &:hover {
      background-color: #b2d4ef;
    }
  }

  .selected {
    border: 1px solid #98baf8;
    background-color: #b2d4ef;
  }

  .disable {
    cursor: not-allowed;
    background-color: #f2f2f2;

    &:hover {
      background-color: #f2f2f2;
    }
  }
}
</style>
