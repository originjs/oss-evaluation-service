<template>
  <div
    :style="`width:${props.width}px;height:${props.height}px;color:#4d97db;padding: 0px 5px;`"
    class="landscape-generate-avatar"
    flex
    items-center
  >
    <span ref="projectNameRef" class="landscape-generate-avatar-text" style="text-align: center">{{
      projectName
    }}</span>
  </div>
</template>
<script setup lang="ts">
const model = defineModel<string>();

const props = defineProps<{
  width: number;
  height: number;
}>();

const formatProjectName = (projectName?: string) => {
  if (!projectName) return '';
  return projectName
    .replaceAll('-', ' ')
    .replaceAll('_', ' ')
    .replaceAll(':', ' ')
    .replaceAll('/', ' ');
};

const projectName = ref(formatProjectName(model.value));
const projectNameRef = ref();

const computedStyle = () => {
  const styles = window.getComputedStyle(projectNameRef.value);
  const fontSize = styles.getPropertyValue('font-size');
  const newFontSize = ((props.width - 10) / projectNameRef.value.scrollWidth) * parseInt(fontSize);
  projectNameRef.value.style.fontSize = `${newFontSize}px`;
  projectNameRef.value.style.lineHeight = `${newFontSize + 1}px`;
};

onMounted(() => {
  computedStyle();
});

watch(model, async newProjectName => {
  projectName.value = formatProjectName(newProjectName);
  nextTick(() => {
    computedStyle();
  });
});

watch(() => [props.width, props.height], computedStyle);
</script>
<style scoped lang="less"></style>
