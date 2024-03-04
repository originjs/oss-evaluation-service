
<template>
  <div>
    <h1>This is home page</h1>
    <CommonButton></CommonButton>

    <div style="margin-top: 10px;">
      <span>
        <el-icon><ElIconBell/></el-icon>
        使用图标需要在原来名称前加上ElIcon
      </span>

      <el-table :data="projects" style="width:100%">
        <el-table-column prop="name" label="Name" width="180" />
        <el-table-column prop="fullName" label="Full Name" width="180" />
        <el-table-column prop="htmlUrl" label="Github Url" />
      </el-table>
    </div>
  </div>
</template>
<script setup lang="ts">

const projects = [
  {
    name: "facebox",
    fullName: "defunkt/facebox",
    htmlUrl: "https://github.com/defunkt/facebox"
  },
  {
    name: "prototype",
    fullName: "prototypejs/prototype",
    htmlUrl: "https://github.com/prototypejs/prototype"
  },
  {
    name: "mootools-core",
    fullName: "mootools/mootools-core",
    htmlUrl: "https://github.com/mootools/mootools-core"
  }
];

</script>