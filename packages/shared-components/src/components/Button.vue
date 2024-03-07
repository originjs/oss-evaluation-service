<script setup lang="ts">
defineProps<{
    text: string
}>()
</script>
<template>
    <button class="button">{{ text }}</button>
</template>

<style scoped>
.button {
  color: #ffffff;
  background-color: #00B7FF;
  border-radius: 6px;
  padding: 8px;
}
</style>
