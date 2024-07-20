<script setup lang="ts">
import { Search } from '@element-plus/icons-vue';
import type { SoftwareBaseInfo } from '@orginjs/oss-evaluation-components-api';
import { getSoftwareBaseInfoApi } from '@orginjs/oss-evaluation-components-api';
import type { PromisifyFn } from '@vueuse/core';
import { useDebounceFn } from '@vueuse/core';

const props = defineProps<{
  techStack?: string;
}>();

const emit = defineEmits<{
  change: [baseInfo: SoftwareBaseInfo];
}>();

const searchInputInstance = ref();
const showSearchBox = ref(false);
const searchValue = ref('');
const softwareBaseInfoList = ref<SoftwareBaseInfo[]>([]);
const loadingInfo = ref(false);

const getSoftwareBaseInfoList: PromisifyFn<(query?: string) => Promise<void>> = useDebounceFn(
  async (query: string) => {
    if (!query) {
      softwareBaseInfoList.value = [];
      return;
    }
    loadingInfo.value = true;
    const res = await getSoftwareBaseInfoApi({
      keyword: searchValue.value,
      techStack: props.techStack,
    });
    if (res.code === 200) {
      softwareBaseInfoList.value = res.data;
    }
    loadingInfo.value = false;
  },
  500,
);

const onClickSoftware = (info: SoftwareBaseInfo) => {
  searchValue.value = '';
  getSoftwareBaseInfoList();
  emit('change', info);
  showSearchBox.value = false;
};
</script>

<template>
  <div class="inline-block">
    <div class="w-full" @click="showSearchBox = true">
      <slot>
        <button
          class="w-full flex flex-items-center p-12px rd-8px h-40px bg-#f6f6f7 b-1 b-solid b-transparent color-black-75 hover:b-#3451b2"
        >
          <span class="flex flex-items-center">
            <span i-ph-magnifying-glass-bold />
            <span class="ml-6px">搜索开源项目</span>
          </span>
        </button>
      </slot>
    </div>

    <el-dialog
      v-model="showSearchBox"
      class="search-open-source-software-dialog"
      width="500"
      :show-close="false"
      append-to-body
      @opened="searchInputInstance.focus()"
    >
      <div class="p-10px">
        <el-input
          ref="searchInputInstance"
          v-model.trim="searchValue"
          class="w-full"
          placeholder="搜索开源项目"
          :prefix-icon="Search"
          clearable
          @input="getSoftwareBaseInfoList"
        />
        <el-scrollbar v-loading="loadingInfo" :max-height="400">
          <div class="text-center pt-10px line-height-50px">
            <span v-show="!softwareBaseInfoList.length">暂无数据...</span>
            <span v-show="loadingInfo">搜索中...</span>
          </div>
          <el-menu>
            <el-menu-item
              v-for="(item, i) in softwareBaseInfoList"
              :key="item.repoName"
              :index="String(i)"
              @click="onClickSoftware(item)"
            >
              <span>{{ item.repoName }}</span>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="less">
.el-dialog.search-open-source-software-dialog {
  border-radius: 6px;

  .el-dialog__header {
    padding: 0;
  }

  .el-menu {
    border-right: none;
  }
}
</style>
