<script setup lang="ts">
const showSearchBox = ref(false)
</script>

<template>
  <button
      class="flex flex-items-center p-[12px] rd-[8px] h-40px bg-[#f6f6f7] cursor-pointer outline-unset b-1 b-solid b-transparent color-black-75 hover:b-[#3451b2]"
      @click="showSearchBox = true"
  >
    <span class="flex flex-items-center">
      <span class="i-custom:search w-[12px] h-[13px]"></span>
      <span class="ml-[6px]">搜索开源项目</span>
    </span>
  </button>
</template>

<style scoped lang="less">
</style>