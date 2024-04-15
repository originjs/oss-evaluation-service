<script setup lang="ts">
const props = defineProps({
  benchmarks: {
    type: Array<{ key: string; label: string; category: string; description: string }>,
    require: true,
  },
  category: {
    type: String,
    require: true,
  },
  value: {
    type: Boolean,
    defalut: false,
    require: true,
  },
});
</script>

<template>
  <el-dialog
    title="Submit project benchmark"
    class="submit-project-benchmark-dialog"
    style="width: 650px"
  >
    <div overflow-y-auto flex justify-center>
      <el-form label-position="top" label-width="auto" class="w-600px">
        <el-form-item label="技术栈">
          <el-input :value="props.category" />
        </el-form-item>
        <el-form-item label="软件名">
          <el-input />
        </el-form-item>
        <el-form-item label="托管仓库地址">
          <el-input />
        </el-form-item>
        <el-form-item label="联系邮箱">
          <el-input />
        </el-form-item>
        <el-form-item>
          <div w-full flex justify-center>
            <el-button type="primary">申请</el-button>
            <!-- <el-button @click="props.value = false">取消</el-button> -->
          </div>
        </el-form-item>
      </el-form>
    </div>
  </el-dialog>
</template>

<style scoped lang="less"></style>
