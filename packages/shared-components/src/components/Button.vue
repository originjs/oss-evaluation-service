<script setup lang="ts">
defineProps<{
    text: string
}>()
</script>
<template>
    <button class="button">{{ text }}</button>
</template>

<style scoped lang="less">
@btn-bg: #00B7FF;

.button {
  color: #ffffff;
  background-color: @btn-bg;
  border-radius: 6px;
  padding: 8px;
}
</style>
