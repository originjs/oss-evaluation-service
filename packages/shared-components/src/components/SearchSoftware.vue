<script setup lang="ts">
import {Search} from '@element-plus/icons-vue'

const showSearchBox = ref(false)
const searchValue = ref('')
const softwareNames = ref<string[]>([])
const loadingSoftwareNames = ref(false)

const getSoftwareNames = async (query: string) => {
  if (!query) {
    softwareNames.value = []
    return
  }
  loadingSoftwareNames.value = true
  await new Promise(r => setTimeout(r, 2000)); // sleep time
  softwareNames.value = ['vue', 'element-plus', 'axios']
  loadingSoftwareNames.value = false
}

const onOpen = (key: string) => {
  console.log(key);
}

const onClose = (key: string) => {
  console.log(key);
}
</script>

<template>
  <div>
    <button
        class="flex flex-items-center p-[12px] rd-[8px] h-40px bg-[#f6f6f7] cursor-pointer outline-unset b-1 b-solid b-transparent color-black-75 hover:b-[#3451b2]"
        @click="showSearchBox = true"
    >
      <span class="flex flex-items-center">
        <span class="i-custom:search w-[12px] h-[13px]"></span>
        <span class="ml-[6px]">搜索开源项目</span>
      </span>
    </button>

    <el-dialog v-model="showSearchBox" width="500" :show-close="false">
      <div class="p-[10px]">
        <el-input
            v-model="searchValue"
            class="w-full"
            placeholder="搜索开源项目"
            :prefix-icon="Search"
            @change="getSoftwareNames"
        />
        <el-scrollbar class="h-full max-h-[200px]">
          <el-menu @open="onOpen" @close="onClose">
            <el-sub-menu v-for="(name, i) in softwareNames" :index="i"><span>{{ name }}</span></el-sub-menu>
          </el-menu>
        </el-scrollbar>
<!--        <el-select
            v-model="searchValue"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="搜索开源项目"
            remote-show-suffix
            :remote-method="getSoftwareNames"
            :loading="loadingSoftwareNames"
            class="w-full"
        >
          <el-option
              v-for="item in softwareNames"
              :key="item"
              :label="item"
              :value="item"
          />
        </el-select>-->
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
</style>