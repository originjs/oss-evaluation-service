<script lang="ts" setup>
import {
  submitApplication as submit,
  downloadExcelTemplate,
} from '@orginjs/oss-evaluation-components-api';
import { ElMessage } from 'element-plus';
import type { UploadFile, UploadRawFile, UploadInstance, MessageOptions } from 'element-plus';
import { createReusableTemplate } from '@vueuse/core';
import { saveAs } from 'file-saver';

enum ApplicationType {
  Evaluation = 1,
  Similar = 2,
  Benchmark = 3,
}

interface TreeData {
  id: string;
  label: string;
  children?: TreeData[];
}

interface Props {
  applicationType?: ApplicationType;
  username?: string;
  employeeNumber?: string;
  email?: string;
  expandField1?: string;
  buName?: string;
  isBuOwner?: boolean;
  alternativeProjectId?: string;
  showInDialog?: boolean;
  successMessage?: string;
  failMessage?: string;
  successMessageConfig?: MessageOptions;
  failMessageConfig?: MessageOptions;
  techStacks?: TreeData[];
}

const props = withDefaults(defineProps<Props>(), {
  techStacks: () => [],
  applicationType: ApplicationType.Evaluation,
  username: '',
  employeeNumber: '',
  email: '',
  expandField1: '',
  buName: '',
  isBuOwner: false,
  alternativeProjectId: '',
  showInDialog: true,
  successMessage: '提交成功',
  failMessage: '提交失败，请稍后重试',
  successMessageConfig: () => ({}),
  failMessageConfig: () => ({}),
});

const emit = defineEmits<{
  (e: 'apply-success'): void;
  (e: 'apply-fail'): void;
  (e: 'cancel'): void;
}>();

const dialogVisible = ref(false);
const formVisible = ref(false);

function showDialogAndForm() {
  dialogVisible.value = true;
  formVisible.value = true;
}

const [DefineTemplate, ReuseTemplate] = createReusableTemplate();

const formInstance = ref();
const applicationSubmitting = ref(false);
const applicationInfo = reactive({
  repoUrl: '',
  comment: '',
  techStack: '',
  subTechStack: '',
  email: '',
  file: undefined as File | undefined,
  envInfo: '',
});
const formRules = reactive({
  repoUrl: [
    {
      required: true,
      pattern: /^https?:\/\/(github|gitee).com/,
      message: '请输入 github 或 gitee 社区源码仓地址',
      trigger: 'blur',
    },
  ],
  email: [
    {
      required: true,
      message: '请输入你的邮箱地址',
      trigger: 'blur',
    },
    {
      pattern: /^.*@.*/,
      message: '邮箱地址格式错误',
      trigger: 'blur',
    },
  ],
  techStack: [
    {
      required: true,
      message: '请输入或选择技术栈',
      trigger: 'blur',
    },
  ],
  subTechStack: [
    {
      required: true,
      message: '请输入或选择子技术栈',
      trigger: 'blur',
    },
  ],
  file: [
    {
      required: true,
      message: '请上传文件',
      trigger: 'blur',
    },
  ],
  envInfo: [
    {
      required: true,
      message: '请输入测试环境信息',
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
        techStack: applicationInfo.techStack,
        subTechStack: applicationInfo.subTechStack,
        comment: applicationInfo.comment,
        applicantEmail: props.email || applicationInfo.email,
        username: props.username,
        employeeNumber: props.employeeNumber,
        buName: props.buName,
        isBuOwner: props.isBuOwner,
        alternativeProjectId: props.alternativeProjectId,
        type: props.applicationType,
        expandField1: props.expandField1,
        createdAt: new Date(),
        file: applicationInfo.file,
        envInfo: applicationInfo.envInfo,
      })
        .then(res => {
          if (res.data === 'success') {
            ElMessage.success({
              message: props.successMessage,
              ...props.successMessageConfig,
            });
            formInstance.value.resetFields();
            dialogVisible.value = false;
            formVisible.value = false;
            emit('apply-success');
          } else {
            ElMessage.warning({
              message: props.failMessage,
              ...props.failMessageConfig,
            });
            emit('apply-fail');
          }
        })
        .catch(() => {
          ElMessage.warning({
            message: props.failMessage,
            ...props.failMessageConfig,
          });
          emit('apply-fail');
        })
        .finally(() => {
          applicationSubmitting.value = false;
        });
    }
  });
}
function cancelApply() {
  formInstance.value.resetFields();
  dialogVisible.value = false;
  formVisible.value = false;
  emit('cancel');
}

const uploadInstance = ref<UploadInstance>();

function handleUploadExceed(files: Array<File>) {
  uploadInstance.value!.clearFiles();
  uploadInstance.value!.handleStart(files[0] as UploadRawFile);
}

function handleUploadChange(uploadFile: UploadFile) {
  const fileSize = uploadFile.raw!.size;
  if (fileSize / 1024 / 1024 > 10) {
    ElMessage.warning('文件大小超过10M，请重新上传');
    uploadInstance.value!.clearFiles();
    return;
  }
  applicationInfo.file = uploadFile.raw;
}

function handleFileRemove() {
  applicationInfo.file = undefined;
}

async function downloadExcel() {
  const blob = await downloadExcelTemplate();
  saveAs(blob as unknown as Blob, 'benchmark_template.xlsx');
}

const subTechStacks = computed(() => {
  const res = props.techStacks.find(item => item.label === applicationInfo.techStack);
  if (res && res.children?.length) {
    return res.children;
  }
  return [];
});

const onChangeSubTechStack = (value: string) => {
  // 以下情况不做处理
  if (
    !value ||
    !value.includes(' / ') || // 值为手动输入(通过下拉选项选择的值一定包含[' / '])
    applicationInfo.techStack // 技术栈已有值
  ) {
    return;
  }

  const [techStack, subTechStack] = value.split(' / ');
  applicationInfo.techStack = techStack;
  applicationInfo.subTechStack = subTechStack;
};

defineExpose({
  submitApplication,
  cancelApply,
});
</script>

<template>
  <div>
    <span class="trigger" @click="showDialogAndForm">
      <slot name="trigger" />
    </span>

    <DefineTemplate>
      <el-form
        ref="formInstance"
        :model="applicationInfo"
        :rules="formRules"
        label-position="right"
        label-width="auto"
        class="form-apply"
      >
        <el-form-item
          v-if="
            applicationType === ApplicationType.Evaluation ||
            applicationType === ApplicationType.Similar
          "
          label="社区源码仓地址"
          prop="repoUrl"
          class="form-item-repo"
        >
          <el-input
            v-model="applicationInfo.repoUrl"
            type="textarea"
            :row="3"
            placeholder="https://github.com/owner-name/repo-name"
          />
        </el-form-item>
        <template v-if="applicationType === ApplicationType.Evaluation">
          <el-form-item label="技术栈" prop="techStack" class="form-item-tech-stack">
            <el-select
              v-if="props.techStacks.length"
              v-model="applicationInfo.techStack"
              placeholder="请输入或选择技术栈"
              filterable
              clearable
              allow-create
              default-first-option
              @change="applicationInfo.subTechStack = ''"
            >
              <el-option
                v-for="{ label } in props.techStacks"
                :key="label"
                :label="label"
                :value="label"
              />
            </el-select>
            <el-input v-else v-model="applicationInfo.techStack" placeholder="请输入技术栈" />
          </el-form-item>
          <el-form-item label="子技术栈" prop="subTechStack" class="form-item-sub-tech-stack">
            <el-select
              v-if="subTechStacks.length"
              v-model="applicationInfo.subTechStack"
              placeholder="请输入或选择子技术栈"
              clearable
              filterable
              allow-create
              default-first-option
            >
              <el-option
                v-for="{ label } in subTechStacks"
                :key="label"
                :label="label"
                :value="label"
              />
            </el-select>
            <el-select
              v-else-if="props.techStacks.length"
              v-model="applicationInfo.subTechStack"
              placeholder="请输入或选择子技术栈"
              clearable
              filterable
              allow-create
              default-first-option
              @change="onChangeSubTechStack"
            >
              <el-option-group
                v-for="techStack in props.techStacks"
                :key="techStack.id"
                :label="techStack.label"
              >
                <el-option
                  v-for="item in techStack.children"
                  :key="item.id"
                  :label="item.label"
                  :value="item.id"
                />
              </el-option-group>
            </el-select>
            <el-input v-else v-model="applicationInfo.subTechStack" placeholder="请输入子技术栈" />
          </el-form-item>
        </template>
        <el-form-item
          v-if="
            applicationType === ApplicationType.Evaluation ||
            applicationType === ApplicationType.Similar
          "
          label="描述"
          prop="comment"
          class="form-item-comment"
        >
          <el-input
            v-model="applicationInfo.comment"
            type="textarea"
            :row="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <template v-if="applicationType === ApplicationType.Benchmark">
          <el-form-item label="上传文件" prop="file" class="form-item-file">
            <el-upload
              ref="uploadInstance"
              :auto-upload="false"
              accept=".xlsx"
              :limit="1"
              drag
              w-full
              mb--15px
              :on-change="handleUploadChange"
              :on-exceed="handleUploadExceed"
              :on-remove="handleFileRemove"
            >
              <el-icon class="el-icon--upload">
                <upload-filled />
              </el-icon>
              <div class="el-upload__text">
                <span>将文件拖拽到此处，或</span>
                <em>点击上传</em>
              </div>
              <template #tip>
                <div mt-7px>
                  <span>请上传小于10M的Excel文件 </span>
                  <span
                    style="color: var(--el-color-primary); cursor: pointer"
                    @click="downloadExcel"
                  >
                    (点击下载模板)
                  </span>
                </div>
              </template>
            </el-upload>
          </el-form-item>
          <el-form-item label="环境信息" prop="envInfo">
            <el-input
              v-model="applicationInfo.envInfo"
              placeholder="The benchmark was run on GitHub-hosted runners(16 GB RAM, 4 Cores, ubuntu-22.04)."
            />
          </el-form-item>
        </template>
        <el-form-item v-if="!email" label="邮箱地址" prop="email">
          <el-input v-model="applicationInfo.email" placeholder="请输入你的邮箱地址" />
        </el-form-item>
        <slot name="operation">
          <el-form-item v-if="!showInDialog" class="form-item-operations">
            <el-button type="primary" :disabled="applicationSubmitting" @click="submitApplication">
              确定
            </el-button>
            <el-button @click="cancelApply">取消</el-button>
          </el-form-item>
        </slot>
      </el-form>
    </DefineTemplate>

    <el-dialog
      v-if="showInDialog"
      v-model="dialogVisible"
      destroy-on-close
      class="dialog-apply"
      @close="cancelApply"
    >
      <ReuseTemplate />
      <template #header>
        <slot name="dialog-header" />
      </template>
      <template #footer>
        <slot name="dialog-footer">
          <el-button @click="cancelApply">取消</el-button>
          <el-button type="primary" :disabled="applicationSubmitting" @click="submitApplication">
            确定
          </el-button>
        </slot>
      </template>
    </el-dialog>
    <ReuseTemplate v-else-if="formVisible" />
  </div>
</template>

<style lang="less" scoped>
:deep(.dialog-apply) {
  min-width: 600px;
  border-radius: 6px;
  .el-dialog__header {
    margin-bottom: 16px;
    border-bottom: 1px solid #f2f3f5;
  }
}
</style>
