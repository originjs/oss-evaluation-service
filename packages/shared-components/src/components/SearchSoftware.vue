<script setup lang="ts">
import { Search } from '@element-plus/icons-vue';
import type { SoftwareInfo } from '@/api/SearchSoftware';
import { getSoftwareNamesApi } from '@/api/SearchSoftware';
import type { PromisifyFn } from '@vueuse/core';
import { useDebounceFn } from '@vueuse/core';

const emit = defineEmits<{
  searchName: [name: string];
}>();

const searchInputInstance = ref();
const showSearchBox = ref(false);
const searchValue = ref('');
const softwareNames = ref<SoftwareInfo[]>([]);
const loadingSoftwareNames = ref(false);

const getSoftwareNames: PromisifyFn<(query: string) => Promise<void>> = useDebounceFn(
  async (query: string) => {
    if (!query) {
      softwareNames.value = [];
      return;
    }
    loadingSoftwareNames.value = true;
    const res = await getSoftwareNamesApi(searchValue.value);
    if (res.code === 200) {
      softwareNames.value = res.data;
    }
    loadingSoftwareNames.value = false;
  },
  500,
);

const onClickSoftware = (name: string) => {
  emit('searchName', name);
  showSearchBox.value = false;
};
</script>

<template>
  <div>
    <div class="inline-block" @click="showSearchBox = true">
      <slot>
        <button
          class="search-btn flex flex-items-center p-12px rd-8px h-40px bg-#f6f6f7 b-1 b-solid b-transparent color-black-75 hover:b-#3451b2"
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
      width="500"
      :show-close="false"
      @opened="searchInputInstance.focus()"
    >
      <div class="p-10px">
        <el-input
          ref="searchInputInstance"
          v-model="searchValue"
          class="w-full"
          placeholder="搜索开源项目"
          :prefix-icon="Search"
          clearable
          @input="getSoftwareNames"
        />
        <el-scrollbar v-loading="loadingSoftwareNames" class="h-full max-h-200px">
          <div class="text-center pt-10px line-height-50px">
            <span v-show="!softwareNames.length">暂无最近搜索记录...</span>
            <span v-show="loadingSoftwareNames">搜索中...</span>
          </div>
          <el-menu>
            <el-menu-item
              v-for="({ fullName }, i) in softwareNames"
              :key="fullName"
              :index="String(i)"
              @click="onClickSoftware(fullName)"
            >
              <span>{{ fullName }}</span>
            </el-menu-item>
          </el-menu>
        </el-scrollbar>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped lang="less">
:deep(.el-dialog) {
  border-radius: 6px;
}

:deep(.el-dialog__header) {
  padding: 0;
}

:deep(.el-menu) {
  border-right: none;
}
</style>
