<script setup lang="ts">
import { ElMessage } from 'element-plus'
import {ref, watch} from 'vue';
import type { SoftwareBaseInfo } from '@orginjs/oss-evaluation-components-api';
import { Search } from '@element-plus/icons-vue';

interface ProjectInfo extends SoftwareBaseInfo {
  versionList: string[];
  selectedVersions: string[];
  selected: boolean;
}

const isSelectedAll = ref(true);
const onlyShowHasBenchmark = ref(true);
const showProjects = ref<ProjectInfo[]>();
let _projects:ProjectInfo[] = [];
const searchKeyWord = ref("");

const props = defineProps({
  projects: {
    type: Array<SoftwareBaseInfo>,
    require: true,
  },
  value: {
    type: Boolean,
    defalut: false,
    require: true,
  },
});

const emit = defineEmits<{(e: 'changeProjects', projects: ProjectInfo[]): void}>();

const getShowProjects = ()=>{
  if(!onlyShowHasBenchmark.value){
    showProjects.value = _projects;
    return;
  }
  showProjects.value = _projects.filter(project=> project.version);
}

watch(()=> props.projects,()=>{
  _projects = [];
  props.projects?.forEach(project =>{
    const _project = project as ProjectInfo;
    _project["versionList"] = [];
    _project["selected"] = false;
    if(_project.version){
      _project["versionList"] = _project.version.split("##");
      _project["selected"] = true;
      _project.selectedVersions = [_project["versionList"][0]];
    }    
    _projects.push(_project);
  })
  getShowProjects();
});  

const chooseProject = (project:ProjectInfo)=>{
  if(!project.version){
    ElMessage.error('系统缺少评测数据，你可以提交评测申请，我们会尽快处理。');
    return;
  }
  if(!project.selected && !project.selectedVersions.length){
    ElMessage.error('至少选择一个版本');
    return;
  }
  project.selected = !project.selected;
  emit('changeProjects',showProjects.value!.filter(p => p.selected));
};

const selectAll = ()=>{
  showProjects.value?.forEach(project => {
    if(!isSelectedAll.value || !project.version){
      project.selected = false;
      return;
    }

    if(project.selectedVersions.length == 0){
      project.selectedVersions.push(project.versionList[0])
    }
    project.selected = true;
  })  

  emit('changeProjects',showProjects.value!.filter(p => p.selected));
}  

const search = (value:string)=>{
  if(!value){
    showProjects.value = _projects;
    return;
  }
  showProjects.value = _projects.filter(project=> project.projectName?.includes(value));
}

const changeSelectedVersion = (project:ProjectInfo)=>{
  if(!project.selectedVersions.length){
    project.selected = false;
  }
  emit('changeProjects',showProjects.value!.filter(p => p.selected));
}

const cancelSelectedProject = (project:SoftwareBaseInfo) => {
  showProjects.value?.forEach(p=>{
    if(p.projectId !== project.projectId){
      return;
    }

    if(p.selectedVersions.length <= 1){
      p.selected = false;
      return;
    }

    p.selectedVersions = p.selectedVersions.filter(v=> v !== project.version);    
  })
}

defineExpose({ cancelSelectedProject });

</script>

<template>
  <el-dialog title="Choose projects" class="choose-projects-dialog">
    <template #header>
      <div flex flex-items-center>
        <h4 font-size-18px fw-400 mr-20px>选择要显示的项目</h4>
        <el-checkbox v-model="isSelectedAll" label="全选" @change="selectAll" />
        <el-checkbox v-model="onlyShowHasBenchmark" @change="getShowProjects" label="仅显示有评测数据的项目" />
        <el-input class="ml-2" style="width: 180px" size="small" placeholder="Please input project name"
          v-model="searchKeyWord" @change="search" :prefix-icon="Search" />
        <div ml-20px flex flex-items-center>
          开源项目总数：{{ showProjects?.length }}
        </div>
      </div>
    </template>
    <div overflow-y-scroll h-lg>
      <div v-for="item in showProjects" :key="item.projectId" flex items-center h-80px class="project"
        :class="{'selected':item.selected,'disable': !item.version}" @click="chooseProject(item)">
        <el-image :src="item.logo" fit="contain" class="w-64px h-64px mr-14px">
          <template #error>
            <div flex flex-justify-center flex-items-center w-full h-full bg-gray-100>
              <el-icon font-size-7 color-gray-400>
                <Picture />
              </el-icon>
            </div>
          </template>ost
        </el-image>
        <div flex flex-col flex-1>
          <div flex items-center justify-between>
            <div flex>
              <b mr-12px font-size-18px>{{ item.repoName }}</b>
              <span mr-4 flex items-center>
                <div i-custom:star font-size-5 mr-1></div>
                {{ item.star }}
              </span>
              <span mr-4 flex items-center>
                <div i-custom:fork font-size-5 mr-1></div>
                {{ item.forksCount }}
              </span>
            </div>
            <div flex>
              <span mr-4 flex items-center>
                <el-select @change="changeSelectedVersion(item)" placeholder="Select version" size="small" collapse-tags
                  collapse-tags-tooltip style="width: 120px" multiple v-model="item.selectedVersions">
                  <template #header>
                    <el-button text type="primary">申请其他版本</el-button>
                  </template>
                  <el-option v-for="version in item.versionList" :label="version" :value="version" :key="version" />
                </el-select>
              </span>
            </div>
          </div>
          <el-text line-clamp="2" class="w-full">
            {{ item.description }}
          </el-text>
        </div>
        <div i-custom:choose font-size-12 position-absolute pos-bottom-0px pos-right-0px v-if="item.selected"></div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="less">
.choose-projects-dialog {
  .project {
    border: 1px solid #ccc;
    padding: 0px 10px;
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
    background-color: #f2f2f2;
    &:hover {
      background-color: #f2f2f2;
    }
  }
}
</style>
