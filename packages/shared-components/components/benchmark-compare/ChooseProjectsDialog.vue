<script setup lang="ts">
import type { SoftwareBaseInfo } from '@orginjs/oss-evaluation-components-api';
import { InfoFilled, Search } from '@element-plus/icons-vue';

const isSelectedAll = ref(true);
const showAll = ref(true);

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
</script>

<template>
  <el-dialog title="Choose projects" class="choose-projects-dialog">
    <template #header>
      <div flex flex-items-center>
        <h4 font-size-18px fw-400 mr-20px>选择要显示的项目</h4>
        <el-checkbox v-model="isSelectedAll" label="全选" />
        <el-checkbox v-model="showAll" label="仅显示有评测数据的项目" />
        <el-input
          class="ml-2"
          style="width: 180px"
          size="small"
          placeholder="Please input project name"
          :prefix-icon="Search"
        />
        <div ml-20px c-gray-400 flex flex-items-center>
          <el-icon><InfoFilled /></el-icon>
          <span font-size-12px c-gray-400 ml-2px>支持Shift和Ctrl批量选择</span>
        </div>
      </div>
    </template>
    <div overflow-y-scroll h-lg>
      <div
        v-for="item in props.projects"
        :key="item.projectId"
        flex
        items-center
        h-80px
        class="project selected"
      >
        <el-image :src="item.logo" fit="contain" class="w-64px h-64px mr-14px">
          <template #error>
            <div flex flex-justify-center flex-items-center w-full h-full bg-gray-100>
              <el-icon font-size-7 color-gray-400>
                <Picture />
              </el-icon>
            </div> </template
          >ost
        </el-image>
        <div flex flex-col flex-1>
          <div flex items-center justify-between>
            <div flex>
              <b mr-12px font-size-18px>{{ item.projectName }}</b>
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
                <el-select placeholder="Select version" size="small" style="width: 120px" multiple>
                  <template #header>
                    <el-button text type="primary">申请其他版本</el-button>
                  </template>
                  <el-option label="无" value="无" />
                </el-select>
              </span>
            </div>
          </div>
          <el-text line-clamp="2" class="w-full">
            {{ item.description }}
          </el-text>
        </div>
        <div i-custom:choose font-size-12 position-absolute pos-bottom-0px pos-right-0px></div>
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
    border: 1px solid #b2d4ef;
  }
}
</style>
