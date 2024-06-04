<script setup lang="ts">
import Layout from '@components/Layout.vue';
</script>

<template>
  <Layout>
    <router-view />
    <el-backtop :right="100" :bottom="160" :visibility-height="400" />
  </Layout>
</template>

<style lang="less"></style>
