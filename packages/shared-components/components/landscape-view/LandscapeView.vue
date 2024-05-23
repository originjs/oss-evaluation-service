<template>
  <div w-full id="landscape" ref="virtualRef">
    <div w-full v-for="(data, index) in landcapseData" :key="data.category" flex mb-16px>
      <div :style="`background-color:${getBackgroundColor(index)}`" w-32px rd-4px c-white text-14px min-h-100px flex
        justify-center items-center mr-16px>
        <span style="transform: rotate(180deg);" write-vertical-right>{{ data.category }}</span>
      </div>
      <div flex-1 flex flex-wrap justify-between>
        <div v-for="subData in data.subcategory" :key='`${data.category}-${subData.subTechStackName}`'
          :style="`width: ${subData.width}px;`">
          <div :style="`background-color:${getBackgroundColor(index)}`" h-32px rd-4px c-white text-14px flex
            justify-center items-center mb-10px>
            <span>{{ subData.subTechStackName }}</span>
            <el-tooltip effect="light" content="点击查看更多项目" placement="right">
              <div class="more-btn" i-custom:more font-size-4 ml-2
                @click="gotoMore(data.category, subData.subTechStackName)" />
            </el-tooltip>
          </div>
          <div flex-1 flex flex-wrap>
            <div v-for="(project, pIndex) in subData.projects"
              :key='`${data.category}-${subData.subTechStackName}-${project.name}`'>
              <div mr-1 mb-1 w-40px h-40px v-if="pIndex < (props.options?.maxProjects || Number.MAX_VALUE)">
                <el-image class="project-logo" lazy :src="project.logo" bg-white fit="fill"
                  @click="clickProject(project)" @mouseenter="showProjectPopover(project, $event)"
                  @mouseleave="hideProjectPopover" />
              </div>
            </div>

            <!-- <div ref="popover" style="display: none;">
              <div
                style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 20px;">
                <span>{{ popoverProject?.category }}</span>
                <span>{{ popoverProject?.subcategory }}</span>
                <span>{{ popoverProject?.name }}</span>
                <span>{{ popoverProject?.description }}</span>
                <span>{{ popoverProject?.htmlUrl }}</span>
                <span>{{ popoverProject?.logo }}</span>
                <span>{{ popoverProject?.starCount }}</span>
                <span>{{ popoverProject?.forksCount }}</span>
              </div>
            </div> -->
          </div>
        </div>
      </div>
    </div>

    <el-popover :width="300" ref="popoverRef" trigger="hover" :virtual-ref="virtualRef" virtual-triggering
      popper-style="box-shadow: rgb(14 18 22 / 35%) 0px 10px 38px -10px, rgb(14 18 22 / 20%) 0px 10px 20px -15px; padding: 20px;">
      <div>
        <span>{{ popoverProject?.category }}</span>
        <span>{{ popoverProject?.subcategory }}</span>
        <span>{{ popoverProject?.name }}</span>
        <span>{{ popoverProject?.description }}</span>
        <span>{{ popoverProject?.htmlUrl }}</span>
        <span>{{ popoverProject?.logo }}</span>
        <span>{{ popoverProject?.starCount }}</span>
        <span>{{ popoverProject?.forksCount }}</span>
      </div>
    </el-popover>
  </div>
</template>
<script setup lang="ts">
import { ref, unref } from 'vue'
// import { createPopper } from '@popperjs/core';
interface Project {
  category: string;
  subcategory: string;
  name: string;
  description: string;
  htmlUrl: string;
  logo: string;
  starCount: number;
  forksCount: number;
}

const props = defineProps<{
  projects: Array<Project>,
  options?: {
    colors: Array<string>,
    maxProjects?: number,
    layout?: { [key: string]: any }
  }
}>();

const emit = defineEmits<{
  (e: 'goMore', category: string, subTechStackName: string): void,
  (e: 'clickProject', project: Project): void
}>()

const landcapseData = ref();
const popoverProject = ref<Project>();
const popoverRef = ref();
const virtualRef = ref();

const BackgroundColors = ['#89bff6', '#89c997', '#e8dd92', '#f0b58e', '#aea3db'];
const getBackgroundColor = (index: number) => {
  let colors = BackgroundColors;
  if (props.options?.colors) {
    colors = props.options.colors;
  }
  return colors[index % colors.length];
}

onMounted(() => {
  let width = document.getElementById("landscape")!.offsetWidth - 32;
  width = width < 350 ? 1248 : width;
  const indexMapping: { [key: string]: { index: number, subIndex: { [key: string]: number } } } = {};
  const _landcapseData: {
    category: string,
    subcategory: Array<
      {
        subTechStackName: string,
        width?: number,
        projects: Array<Projects>
      }
    >
  }[] = [];
  let category;
  let subcategory;
  let subcategoryArray;
  const layout = props.options?.layout;
  if (layout) {
    for (category in layout) {
      indexMapping[category] = {
        index: _landcapseData.length,
        subIndex: {}
      };

      subcategoryArray = [];
      for (subcategory in layout[category]) {
        indexMapping[category].subIndex[subcategory] = subcategoryArray.length;
        subcategoryArray.push({ subTechStackName: subcategory, width: width * layout[category][subcategory] - 10, projects: [] });
      }

      _landcapseData.push({ "category": category, "subcategory": subcategoryArray });
    }
  }

  props.projects.forEach((item: Projects) => {
    if (typeof indexMapping[item.category] === 'undefined') {
      indexMapping[item.category] = {
        index: _landcapseData.length,
        subIndex: {}
      };
      _landcapseData.push({ "category": item.category, "subcategory": [] });
    }
    category = _landcapseData[indexMapping[item.category].index];

    if (typeof indexMapping[item.category].subIndex[item.subcategory] === 'undefined') {
      indexMapping[item.category].subIndex[item.subcategory] = category.subcategory.length;
      category.subcategory.push({ subTechStackName: item.subcategory, projects: [] });
    }

    subcategory = category.subcategory[indexMapping[item.category].subIndex[item.subcategory]];
    subcategory.projects.push(item);
  });
  landcapseData.value = _landcapseData;
});

function gotoMore(category: string, subTechStackName: string) {
  emit('goMore', category, subTechStackName)
}

function clickProject(project: Project) {
  emit('clickProject', project);
}

const showProjectPopover = (project: Project, event: MouseEvent) => {
  popoverProject.value = project;
  const popperRef = unref(popoverRef).popperRef;
  popperRef.triggerRef = event.target;
  //popperRef?.delayHide?.()

}

const hideProjectPopover = () => {

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
