<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import type { CheckboxValueType, TabPaneName } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { getTechStacks } from '@orginjs/oss-evaluation-components-api';
import type { BenchmarkTechStack } from '@orginjs/oss-evaluation-api-server';
import BenchmarkCompareContent from './BenchmarkCompareContent.vue';
import { useRoute, useRouter } from 'vue-router';
import { ApplyAdd } from '../apply-add';
import { difference } from 'lodash-es';

const isLoadingBenchmarkTechStacks = ref(true);
const checkedTabs = useStorage<string[]>('local-checked-benchmark-tabs', []);
const benchmarkTechStacks = useStorage<BenchmarkTechStack[]>('local-benchmark-tabs', []);
const activeName = ref<string>('');
const searchTabValue = ref('');
const searchTabs = computed(() => {
  return searchTabValue.value
    ? benchmarkTechStacks.value.filter(tab =>
        tab.techStack.toLowerCase().includes(searchTabValue.value.toLowerCase()),
      )
    : benchmarkTechStacks.value;
});
const checkAllTabs = ref(false);
const isIndeterminateTabs = ref(false);

const updateCheckAllTabsState = () => {
  checkAllTabs.value = checkedTabs.value.length === benchmarkTechStacks.value.length;
  isIndeterminateTabs.value =
    checkedTabs.value.length > 0 && checkedTabs.value.length < benchmarkTechStacks.value.length;
};

const route = useRoute();
const router = useRouter();
getTechStacks().then(res => {
  const oldTechStacks = benchmarkTechStacks.value.map(item => item.techStack);

  benchmarkTechStacks.value = res.data || [];
  const reqTechStacks = benchmarkTechStacks.value.map(item => item.techStack);

  if (checkedTabs.value.length) {
    // 过滤掉已经失效的技术栈
    const validCheckedTabs = checkedTabs.value.filter(tab =>
      benchmarkTechStacks.value.some(item => item.techStack === tab),
    );
    // 新增的技术栈
    const addedTabs = difference(reqTechStacks, oldTechStacks);

    checkedTabs.value = [...validCheckedTabs, ...addedTabs];
  } else {
    checkedTabs.value = reqTechStacks;
  }

  // 加上路由参数指定的技术栈
  const queryTechStack = route.query.techStack as string;
  if (
    queryTechStack &&
    reqTechStacks.includes(queryTechStack) &&
    !checkedTabs.value.includes(queryTechStack)
  ) {
    checkedTabs.value.push(queryTechStack);
  }

  if (queryTechStack && checkedTabs.value.includes(queryTechStack)) {
    activeName.value = decodeURIComponent(queryTechStack);
  } else {
    activeName.value = checkedTabs.value[0];
  }

  updateCheckAllTabsState();
  isLoadingBenchmarkTechStacks.value = false;
});
watch(activeName, () => {
  router.push({
    path: route.path,
    query: {
      techStack: activeName.value,
    },
  });
});

const onCheckedTabsChange = (tabNames: CheckboxValueType[]) => {
  if (tabNames.length) {
    activeName.value = tabNames[0] as string;
  }

  updateCheckAllTabsState();
};

const onCheckAllTabsChange = (val: CheckboxValueType) => {
  checkedTabs.value = val ? benchmarkTechStacks.value.map(item => item.techStack) : [];
  isIndeterminateTabs.value = false;
};

const handleTabsEdit = (targetName: TabPaneName | undefined, action: 'remove' | 'add') => {
  // 仅处理 remove 场景，add 场景无需处理，因为使用的是 checkbox 控制添加
  if (action === 'remove') {
    const checkedTabsCopy = checkedTabs.value;
    let activeNameCopy = activeName.value;
    if (activeNameCopy === targetName) {
      checkedTabsCopy.forEach((name, index) => {
        if (name === targetName) {
          const nextTab = checkedTabsCopy[index + 1] || checkedTabsCopy[index - 1];
          if (nextTab) {
            activeNameCopy = nextTab;
          }
        }
      });
    }

    activeName.value = activeNameCopy;
    checkedTabs.value = checkedTabsCopy.filter(name => name !== targetName);
    updateCheckAllTabsState();
  }
};
</script>

<template>
  <div class="benchmark-compare-main">
    <el-tabs v-model="activeName" type="card" editable @edit="handleTabsEdit">
      <template #add-icon>
        <el-popover :width="240" trigger="click" :show-arrow="false" :offset="6">
          <template #reference>
            <div class="flex items-center">
              <el-icon><Setting /></el-icon>
              <span style="font-size: 16px; margin-left: 4px">自定义技术栈</span>
            </div>
          </template>
          <div class="p-4px">
            <div class="pb-8px b-#fff">
              <el-input
                v-model="searchTabValue"
                class="w-full"
                placeholder="请输入关键字"
                :prefix-icon="Search"
                clearable
              />
            </div>
            <el-scrollbar max-height="400px">
              <div class="flex flex-col items-center justify-center pl-4px">
                <el-checkbox
                  v-model="checkAllTabs"
                  :indeterminate="isIndeterminateTabs"
                  @change="onCheckAllTabsChange"
                  >全选</el-checkbox
                >
                <el-checkbox-group v-model="checkedTabs" @change="onCheckedTabsChange">
                  <el-checkbox
                    v-for="tab in searchTabs"
                    :key="tab.techStack"
                    :label="tab.techStack"
                    :value="tab.techStack"
                  />
                </el-checkbox-group>
              </div>
            </el-scrollbar>
          </div>
        </el-popover>
      </template>

      <el-tab-pane
        v-for="tabName in isLoadingBenchmarkTechStacks ? [] : checkedTabs"
        :key="tabName"
        :label="tabName"
        :name="tabName"
      >
        <BenchmarkCompareContent
          :benchmark-tech-stacks="benchmarkTechStacks"
          :tech-stack="tabName"
          :active-tech-stack="activeName"
        >
          <template #application="slotProps">
            <slot
              name="application"
              :benchmark-tech-stack="slotProps.benchmarkTechStack"
              :benchmark-tech-stacks="slotProps.benchmarkTechStacks"
            >
              <ApplyAdd
                :application-type="3"
                :benchmark-tech-stack="slotProps.benchmarkTechStack"
                :benchmark-tech-stacks="slotProps.benchmarkTechStacks"
              >
                <template #trigger>
                  <el-button type="primary" text>新增Benchmark</el-button>
                </template>
                <template #dialog-header>
                  <div font-size-18px>新增Benchmark</div>
                </template>
              </ApplyAdd>
            </slot>
          </template>
        </BenchmarkCompareContent>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped lang="less">
@border-color: #e6e6e6;

:deep(.el-tabs__new-tab) {
  margin: 10px;
  border: 0;
  font-size: 20px;
  width: fit-content;
}

:deep(.el-scrollbar .el-checkbox) {
  margin: 0;
  width: 100%;
}

:deep(.el-scrollbar .el-checkbox-group) {
  margin: 0;
  width: 100%;
}

.benchmark-compare-main {
  min-height: calc(100vh - 177px);
  border-bottom: 1px @border-color solid;
  border-right: 1px @border-color solid;
  margin: 0;
  padding: 20px 20px;
}
</style>
