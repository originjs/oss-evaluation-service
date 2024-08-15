<script setup lang="ts">
import { Setting, InfoFilled } from '@element-plus/icons-vue';
import {
  getProjectsByTechStack,
  getIndexByTechStack,
  getBenchmarkResultByTechStack,
} from '@orginjs/oss-evaluation-components-api';
import type {
  HandleFilterTableRows,
  HandleSortTableColumns,
  PreventClickIndexName,
  Resource,
} from './BenchmarkCompareContent.vue';
import BenchmarkCompareContent from './BenchmarkCompareContent.vue';

const resource: Resource = {
  getProjects: () => getProjectsByTechStack('构建工具', '构建工具'),
  getBenchmarkIndex: async () => {
    const response = await getIndexByTechStack('构建工具');
    response.data = [
      {
        indexName: 'score',
        displayName: '得分',
        unit: '',
      },
      {
        indexName: 'version',
        displayName: '版本',
        unit: '',
      },
      ...response.data,
    ];
    return response;
  },
  getBenchmarkResult: () => getBenchmarkResultByTechStack('构建工具'),
};

const handleFilterTableRows: HandleFilterTableRows = ({ rows, benchmarkIndex }) => {
  return rows.filter(
    row =>
      benchmarkIndex.some(item => item.indexName === row.indexName) ||
      ['score', 'version'].includes(row.indexName),
  );
};

const handleSortTableColumns: HandleSortTableColumns = (a, b, sortedIndexName) => {
  if (sortedIndexName === 'score') {
    return b[sortedIndexName]! - a[sortedIndexName]!;
  }
};

const preventClickIndexName: PreventClickIndexName = benchmarkName => {
  if (benchmarkName === '版本') {
    return true;
  }
};

const options = {
  handleFilterTableRows,
  handleSortTableColumns,
  preventClickIndexName,
};

const selectedProject = ref('Vue3');
const selectedCompile = ref('babel');
const selectedLanguage = ref('js');
</script>

<template>
  <BenchmarkCompareContent :resource="resource" :options="options">
    <template #tool-top>
      <div class="flex w-full">
        <div class="flex w-full">
          <div class="flex flex-items-center mr-8">
            <span>样本工程:</span>
            <el-select v-model="selectedProject" placeholder="Select" style="width: 200px">
              <el-option label="React示例工程" value="react" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:react mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>React示例工程</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      该工程是一个普通React框架的前端工程
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="Vue3示例工程" value="Vue3" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:vue mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>Vue3示例工程</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      该工程是一个普通Vue3框架的前端工程
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="React大量组件工程" value="react-big" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:react mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>React大量组件工程</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      该工程是一个React框架的前端工程，工程包含1000个组件嵌套组成。
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="Vue3大量组件工程" value="vue3-big" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:vue mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>Vue3大量组件工程</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      该工程是一个Vue3框架的前端工程，工程包含1000个组件嵌套组成。
                    </span>
                  </div>
                </div>
              </el-option>
            </el-select>
          </div>
          <div class="flex flex-items-center mr-8">
            <span class="mr-2">编译器:</span>
            <el-select v-model="selectedCompile" placeholder="Select" style="width: 200px">
              <el-option label="Babel" value="babel" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:babel mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>Babel</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      一个流行的开源JavaScript编译器，用于将新版本的JavaScript代码转换为向后兼容的旧版本代码。
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="SWC" value="swc" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:swc mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>SWC - Speedy Web Compiler</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      一个用Rust编写的开源JavaScript/TypeScript编译器。
                    </span>
                  </div>
                </div>
              </el-option>
            </el-select>
          </div>
          <div class="flex flex-items-center mr-8">
            <span class="mr-2">编程语言:</span>
            <el-select v-model="selectedLanguage" placeholder="Select" style="width: 200px">
              <el-option label="JavaScript" value="js" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:javascript mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>JavaScript</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      样本工程主要使用JavaScript ES6语法编写
                    </span>
                  </div>
                </div>
              </el-option>
              <el-option label="TypeScript" value="ts" style="height: 68px">
                <div class="flex flex-items-center">
                  <div>
                    <span class="i-custom:typescript mr-2 h-50px w-50px" />
                  </div>
                  <div class="flex flex-col flex-1">
                    <span>TypeScript</span>
                    <span style="color: var(--el-text-color-secondary); font-size: 13px">
                      样本工程主要使用JavaScript ES6语法编写
                    </span>
                  </div>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>
        <div class="flex flex-items-center">
          <slot name="application" />
          <el-icon class="cursor-pointer">
            <Setting />
          </el-icon>
        </div>
      </div>
    </template>
    <template #tool-right="{ benchmarkResult }">
      <div class="flex flex-items-center font-size-12px">
        <el-icon class="mr-8px" color="#fdbb7b">
          <InfoFilled />
        </el-icon>
        {{ benchmarkResult[0]?.envInfo }}
      </div>
    </template>
    <template #cell-content="{ row, column }">
      <div v-if="row.benchmarkName === '得分' || row.benchmarkName === '版本'" class="text-center">
        {{ row[column.prop] }}
      </div>
    </template>
  </BenchmarkCompareContent>
</template>

<style scoped lang="less"></style>
