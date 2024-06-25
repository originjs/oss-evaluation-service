<script lang="ts" setup>
import { submitApplication as submit } from '@orginjs/oss-evaluation-components-api';
import { ElMessage } from 'element-plus';

const applicationDialogVisible = ref(false);
const formInstance = ref();
const applicationSubmitting = ref(false);
const applicationInfo = reactive({
  repoUrl: '',
  comment: '',
  email: '',
});
const formRules = reactive({
  repoUrl: [
    {
      required: true,
      message: '请输入社区源码仓地址',
      trigger: 'blur',
    },
  ],
  email: [
    {
      required: true,
      message: '请输入你的邮箱地址',
      trigger: 'blur',
    },
  ],
});
function submitApplication() {
  formInstance.value.validate((valid: boolean) => {
    if (valid) {
      applicationSubmitting.value = true;
      submit({
        repoUrl: applicationInfo.repoUrl,
        comment: applicationInfo.comment,
        applicantEmail: applicationInfo.email,
        username: '',
        alternativeProjectId: '',
        type: 1,
        expandField1: '',
        createdAt: new Date(),
      })
        .then(res => {
          if (res.data === 'success') {
            ElMessage.success('已提交申请');
            formInstance.value.resetFields();
            applicationDialogVisible.value = false;
          } else {
            ElMessage.warning('提交申请失败，请稍后重试');
          }
        })
        .catch(() => {
          ElMessage.warning('提交申请失败，请稍后重试');
        })
        .finally(() => {
          applicationSubmitting.value = false;
        });
    }
  });
}
function cancelApply() {
  formInstance.value.resetFields();
  applicationDialogVisible.value = false;
}
</script>

<template>
  <div>
    <el-button
      icon="Plus"
      round
      color="#646cff"
      size="large"
      @click="applicationDialogVisible = true"
      >申请新增</el-button
    >
    <el-dialog
      v-model="applicationDialogVisible"
      title="申请新增开源软件"
      destroy-on-close
      @close="cancelApply"
    >
      <el-form
        ref="formInstance"
        :model="applicationInfo"
        :rules="formRules"
        label-position="right"
        label-width="auto"
      >
        <el-form-item label="社区源码仓地址" prop="repoUrl">
          <el-input
            v-model="applicationInfo.repoUrl"
            type="textarea"
            :row="3"
            placeholder="https://github.com/owner-name/repo-name"
          />
        </el-form-item>
        <el-form-item label="描述" prop="comment">
          <el-input
            v-model="applicationInfo.comment"
            type="textarea"
            :row="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="邮箱地址" prop="email">
          <el-input v-model="applicationInfo.email" placeholder="请输入你的邮箱地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelApply">取消</el-button>
        <el-button type="primary" :disabled="applicationSubmitting" @click="submitApplication">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
:deep(.el-dialog) {
  border-radius: 6px;
}
</style>
