<template>
  <div>
    this is page2 page
    <el-button @click="test">Request backend test</el-button>
    <div style="margin-top: 10px;">
      <el-button @click="ElMessage('hello')">button</el-button>
      <ElButton :icon="ElIconEditPen" type="success">button</ElButton>
      <LazyElButton type="warning">lazy button</LazyElButton>
    </div>

    <br>
    <SharedButton text="shared button"></SharedButton>
  </div>
</template>

<script setup lang="ts">
import { Button as SharedButton } from "@orginjs/oss-evaluation-components"

async function test() {
  const { data } = await useFetch('/api/test');
  ElMessageBox.alert(data.value.message);
}
</script>