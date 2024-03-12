<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'

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
  await new Promise(r => setTimeout(r, 2000)) // sleep time
  softwareNames.value = ['vue', 'element-plus', 'axios']
  loadingSoftwareNames.value = false
}

const onOpen = (key: string) => {
  console.log(key)
}

const onClose = (key: string) => {
  console.log(key)
}
</script>

<template>
  <div>
    <button
      class="search-btn flex flex-items-center p-12px rd-8px h-40px bg-#f6f6f7 b-1 b-solid b-transparent color-black-75 hover:b-#3451b2"
      @click="showSearchBox = true"
    >
      <span class="flex flex-items-center">
        <span i-ph-magnifying-glass-bold />
        <span class="ml-6px">搜索开源项目</span>
      </span>
    </button>

    <el-dialog v-model="showSearchBox" width="500" :show-close="false">
      <div class="p-10px">
        <el-input
          v-model="searchValue"
          class="w-full"
          placeholder="搜索开源项目"
          :prefix-icon="Search"
          @change="getSoftwareNames"
        />
        <el-scrollbar class="h-full max-h-200px" v-loading="loadingSoftwareNames">
          <div class="text-center pt-10px line-height-50px">
            <span v-show="!softwareNames.length">暂无最近搜索记录...</span>
            <span v-show="loadingSoftwareNames">搜索中...</span>
          </div>
          <el-menu @open="onOpen" @close="onClose">
            <el-menu-item v-for="(name, i) in softwareNames" :index="String(i)"
              ><span>{{ name }}</span></el-menu-item
            >
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
