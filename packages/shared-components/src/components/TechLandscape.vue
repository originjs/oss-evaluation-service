<script setup lang="ts"></script>

<template>
  <div class="min-h-600px w-full overflow-hidden position-relative">
    <iframe
      ref="iframeInstance"
      class="landscape-iframe w-full border-none position-absolute left-0 top-[-72px]"
      src="https://oss-evaluation-landscape.vercel.app"
    />
  </div>
</template>

<style scoped lang="less">
.landscape-iframe {
  height: calc(100% + 193px);
}
</style>
