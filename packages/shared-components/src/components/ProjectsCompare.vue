<script setup lang="ts">
import { Close, Switch, ArrowDown } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import type { SoftwareBaseInfo, SoftwareInfo } from '@/api/SoftwareDetails';
import { getSoftwareInfo } from '@/api/SoftwareDetails';
import { toKilo, formatNumber, formatFloat, formatString } from '@/utils/number';
import { getLevelColor } from '@utils/color';
import { ElMessage } from 'element-plus';
import { get as _get } from 'lodash-es';

const emit = defineEmits<{
  removeRepo: [repoName: string];
  addRepo: [repoName: string];
}>();

const prop = defineProps({
  repositories: {
    type: Array<string>,
    required: true,
  },
});

const projects = reactive<Array<SoftwareInfo>>([]);
prop.repositories.forEach(repoName => {
  const encodedname = encodeURIComponent(repoName);
  getSoftwareInfo(encodedname)
    .then((data: { [x: string]: any }) => {
      projects.push(data['data']);
    })
    .catch((error: any) => {
      console.error('Failed to get data, try again later.', error);
    });
});

function isStarTop(currStar: number) {
  return !projects.some(item => Number(item.star) > Number(currStar));
}

function isGood(currValue: string, valuesKey: string) {
  if (Number(currValue) === 0) {
    return false;
  }
  const keys = valuesKey.split('.');

  let isAllEqual = true;
  let isTopValue = true;
  let preValue = currValue;
  let parentValue: any;

  for (let item of projects) {
    parentValue = item;
    for (let key of keys) {
      parentValue = parentValue[key];
    }

    if (isAllEqual && preValue != parentValue) {
      isAllEqual = false;
    }

    if (Number(parentValue) > Number(currValue)) {
      isTopValue = false;
      break;
    }
    preValue = parentValue;
  }
  return isTopValue && !isAllEqual;
}

const findRow = (element: HTMLElement, className: string) => {
  let parent = element.parentNode as HTMLElement;

  while (parent) {
    if (parent.classList?.contains(className)) {
      return parent;
    }

    parent = parent.parentNode as HTMLElement;
  }

  return null;
};

const tipDiv = ref<HTMLElement | null>(null);
function showChooseBorder(title: string, event: MouseEvent) {
  const row = findRow(event.target as HTMLElement, 'row');
  if (row) {
    row.appendChild(tipDiv.value as HTMLElement);
    tipDiv.value!.innerText = title;
    tipDiv.value!.style.display = 'block';
    tipDiv.value!.style.left = '50%';
    tipDiv.value!.style.top = '-25px';
  }
}

function hideChooseBorder() {
  tipDiv.value!.style.display = 'none';
}

const removeSoftware = (index: number) => {
  if (projects.length <= 1) {
    ElMessage.warning('至少需要保留一个软件');
    return;
  }
  const project = projects.splice(index, 1);
  emit('removeRepo', project[0].repoName);
};

const switchOrder = (index: number) => {
  [projects[index], projects[index + 1]] = [projects[index + 1], projects[index]];
};

const showBasic = ref(true);
const showFunction = ref(true);
const showPerformance = ref(true);
const showQuality = ref(true);
const showEcology = ref(true);

const onClickProject = async ({ repoName }: SoftwareBaseInfo) => {
  if (projects.some(item => item.repoName === repoName)) {
    ElMessage.success(`${repoName} 已添加`);
    return;
  }
  emit('addRepo', repoName);
  const { data } = await getSoftwareInfo(encodeURIComponent(repoName));
  projects.push(data);
};

const isShowDiff = ref(false);
const getShowRow = (path: string) => {
  if (!isShowDiff.value) {
    return true;
  }

  if (path === 'satisfaction') {
    const res = new Set(
      projects.map(item => {
        const arr = _get(item, path, []).slice(-3);
        return arr.map(val => `${val.year}${val.val}`).join(',');
      }),
    );
    return res.size > 1;
  }

  if (path === 'document.documentScore') {
    const paths = [
      path,
      'document.hasReadme',
      'document.hasWebsite',
      'document.hasChangelog',
      'document.hasContributing',
    ];
    let count = 0;
    paths.forEach(p => (count += new Set(projects.map(item => _get(item, p))).size));
    return count > 5;
  }

  const res = new Set(projects.map(item => _get(item, path)));
  return res.size > 1;
};
</script>

<template>
  <div class="main">
    <div class="page-title flex justify-between items-center">
      <div>
        <span class="menu selected">开源软件对比</span>
        <span class="menu">Benchmark</span>
      </div>
      <div>
        <div class="mr-12px flex items-center">
          <el-switch v-model="isShowDiff" style="--el-switch-on-color: #13ce66" />
          <span class="pl-6px">显示{{ isShowDiff ? '差异' : '全部' }}</span>
        </div>
      </div>
    </div>
    <el-affix :offset="64">
      <div class="row border-top">
        <div class="border param-name"></div>
        <div v-for="idx in 5" :key="idx" class="param-value border">
          <div v-if="projects[idx - 1]" class="value-div" style="position: relative">
            <el-image :src="projects[idx - 1]?.logo" fit="contain" class="w-64px h-64px mr-14px">
              <template #error>
                <div flex flex-justify-center flex-items-center w-full h-full bg-gray-100>
                  <el-icon font-size-7 color-gray-400>
                    <Picture />
                  </el-icon>
                </div>
              </template>
            </el-image>
            <el-icon class="close-btn cursor-pointer hover-color-#F56C6C" @click="removeSoftware(idx - 1)">
              <Close />
            </el-icon>
              <el-button v-if="idx < projects.length" class="switch-btn" :icon="Switch" circle @click="switchOrder(idx - 1)" />
          </div>
          <div v-else class="none-project-div">
            <SearchSoftware class="w-full pr-10px" @change="onClickProject">
              <button
                class="w-full flex flex-items-center p-12px rd-8px h-40px bg-#f6f6f7 b-1 b-solid b-transparent color-black-75 hover:b-#3451b2"
              >
              <span class="flex flex-items-center">
                <span i-ph-magnifying-glass-bold />
                <span class="ml-6px">添加软件对比</span>
              </span>
              </button>
            </SearchSoftware>
          </div>
        </div>
      </div>
    </el-affix>

    <div class="row">
      <div class="border param-name">简介</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <el-tooltip :content="projects[idx - 1].description" placement="top-start">
            <el-text class="description" line-clamp="3">{{
              projects[idx - 1].description
            }}</el-text>
          </el-tooltip>
        </div>
      </div>
    </div>
    <div
      v-show="getShowRow('techStack')"
      class="row"
      @mouseover="showChooseBorder('技术栈', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">技术栈</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <el-link type="primary">{{ projects[idx - 1].techStack }}</el-link>
        </div>
      </div>
    </div>

    <div
      v-show="getShowRow('evaluation.functionScore')"
      class="row"
      @mouseover="showChooseBorder('功能', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">
        <span i-custom:function mr-2 />
        <span>功能</span>
      </div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span
            :class="{
              good: isGood(projects[idx - 1].evaluation.functionScore, 'evaluation.functionScore'),
            }"
            >{{ formatFloat(projects[idx - 1].evaluation.functionScore) }}/100</span
          >
        </div>
      </div>
    </div>
    <div
      v-show="getShowRow('evaluation.performanceScore')"
      class="row"
      @mouseover="showChooseBorder('性能', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">
        <span i-custom:performance mr-2 />
        <span>性能</span>
        <span i-custom:profession />
      </div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span
            :class="{
              good: isGood(
                projects[idx - 1].evaluation.performanceScore,
                'evaluation.performanceScore',
              ),
            }"
          >
            {{ formatFloat(projects[idx - 1].evaluation.performanceScore) }}/100
          </span>
        </div>
      </div>
    </div>
    <div
      v-show="getShowRow('evaluation.qualityScore')"
      class="row"
      @mouseover="showChooseBorder('质量', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">
        <span i-custom:quality mr-2 />
        <span>质量</span>
      </div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span
            :class="{
              good: isGood(projects[idx - 1].evaluation.qualityScore, 'evaluation.qualityScore'),
            }"
          >
            {{ formatFloat(projects[idx - 1].evaluation.qualityScore) }}/100
          </span>
        </div>
      </div>
    </div>
    <div
      v-show="getShowRow('evaluation.ecologyScore')"
      class="row"
      @mouseover="showChooseBorder('生态', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">
        <span i-custom:ecology mr-2 />
        <span>生态</span>
      </div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span
            :class="{
              good: isGood(projects[idx - 1].evaluation.ecologyScore, 'evaluation.ecologyScore'),
            }"
          >
            {{ formatFloat(projects[idx - 1].evaluation.ecologyScore) }}/100
          </span>
        </div>
      </div>
    </div>

    <div class="border categar" @click="showBasic = !showBasic">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown v-show="showBasic" />
        <ArrowRight v-show="!showBasic" />
      </el-icon>
      基本信息
    </div>
    <TransitionGroup name="list" tag="div" class="overflow-hidden">
    <div
      v-show="showBasic && getShowRow('star')"
      key="1"
      class="row"
      @mouseover="showChooseBorder('Stars', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">Stars</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span style="color: #409eff" :class="{ good: isStarTop(projects[idx - 1].star) }"
            >{{ toKilo(projects[idx - 1].star) }} k</span
          >
        </div>
      </div>
    </div>
    <div
      v-show="showBasic && getShowRow('language')"
      key="2"
      class="row"
      @mouseover="showChooseBorder('开发语言', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">开发语言</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span>{{ projects[idx - 1].language }}</span>
        </div>
      </div>
    </div>
    <div
      v-show="showBasic && getShowRow('language')"
      key="3"
      class="row"
      @mouseover="showChooseBorder('代码量', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">代码量</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span>{{ toKilo(projects[idx - 1].codeLines) }} kl</span>
        </div>
      </div>
    </div>

    <div
      v-show="showBasic && getShowRow('firstCommit')"
      key="4"
      class="row"
      @mouseover="showChooseBorder('首次提交', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">首次提交</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span> {{ dayjs(projects[idx - 1].firstCommit).format('YYYY-MM-DD') }} </span>
        </div>
      </div>
    </div>
    <div
      v-show="showBasic && getShowRow('license')"
      key="5"
      class="row"
      @mouseover="showChooseBorder('License', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">License</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span> {{ projects[idx - 1].license }} </span>
        </div>
      </div>
    </div>
    </TransitionGroup>

    <div class="border categar" @click="showFunction = !showFunction">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown v-show="showFunction" />
        <ArrowRight v-show="!showFunction" />
      </el-icon>
      功能
    </div>
    <TransitionGroup name="list" tag="div" class="overflow-hidden">
    <div
      v-show="showFunction && getShowRow('satisfaction')"
      key="1"
      class="row"
      @mouseover="showChooseBorder('开发者满意度', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">开发者满意度</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div" style="">
          <span v-for="value in projects[idx - 1].satisfaction?.slice(-3)" :key="value.year">
            {{ value.year }} : {{ value.val }}%
          </span>
          <span v-if="!projects[idx - 1].satisfaction.length">-</span>
        </div>
      </div>
    </div>

    <div
      v-show="showFunction && getShowRow('document.documentScore')"
      key="2"
      class="row"
      @mouseover="showChooseBorder('文档最佳实践', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">文档最佳实践</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <div>
            <div style="text-align: center; margin-bottom: 8px">
              {{ formatFloat(projects[idx - 1].document.documentScore) }}%
            </div>
            <div>
              <span
                v-if="projects[idx - 1].document.hasReadme"
                i-ph-check-circle
                mr-1
                font-size-5
                color-green-300
              />
              <span v-else i-ph-minus-circle mr-1 font-size-5 color-gray-400 />
              Readme
            </div>
            <div>
              <span
                v-if="projects[idx - 1].document.hasWebsite"
                i-ph-check-circle
                mr-1
                font-size-5
                color-green-300
              />
              <span v-else i-ph-minus-circle mr-1 font-size-5 color-gray-400 />
              Website
            </div>
            <div>
              <span
                v-if="projects[idx - 1].document.hasChangelog"
                i-ph-check-circle
                mr-1
                font-size-5
                color-green-300
              />
              <span v-else i-ph-minus-circle mr-1 font-size-5 color-gray-400 />
              Changelog
            </div>
            <div>
              <span
                v-if="projects[idx - 1].document.hasContributing"
                i-ph-check-circle
                mr-1
                font-size-5
                color-green-300
              />
              <span v-else i-ph-minus-circle mr-1 font-size-5 color-gray-400 />
              Governance
            </div>
          </div>
        </div>
      </div>
    </div>
    </TransitionGroup>

    <div class="border categar" @click="showPerformance = !showPerformance">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown v-show="showPerformance" />
        <ArrowRight v-show="!showPerformance" />
      </el-icon>
      性能
    </div>
    <TransitionGroup name="list" tag="div" class="overflow-hidden">
    <div
      v-show="showPerformance && getShowRow('evaluation.performanceScore')"
      key="1"
      class="row"
      @mouseover="showChooseBorder('Benchmark Score', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name" style="height: 60px; font-size: 14px">Benchmark Score</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span>{{ formatFloat(projects[idx - 1].evaluation.performanceScore) }}</span>
        </div>
      </div>
    </div>
    </TransitionGroup>

    <div class="border categar" @click="showQuality = !showQuality">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown v-show="showQuality" />
        <ArrowRight v-show="!showQuality" />
      </el-icon>
      质量
    </div>
    <TransitionGroup name="list" tag="div" class="overflow-hidden">
    <div v-show="showQuality" key="1" style="display: flex">
      <div
        class="border-left border-top"
        style="
          width: 22px;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          text-align: center;
        "
      >
        OpenSSF Scorecard
      </div>
      <div style="flex: 1">
        <div
          v-show="getShowRow('scorecard.score')"
          class="row"
          @mouseover="showChooseBorder('Score', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Score" placement="top-start">
              <el-text size="small" line-clamp="3">Score</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{ good: isGood(projects[idx - 1].scorecard.score, 'scorecard.score') }">
                {{ formatFloat(projects[idx - 1].scorecard.score) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.codeReview')"
          class="row"
          @mouseover="showChooseBorder('Code-Review', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Code-Review" placement="top-start">
              <el-text size="small" line-clamp="3">Code-Review</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(projects[idx - 1].scorecard.codeReview, 'scorecard.codeReview'),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.codeReview) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.maintained')"
          class="row"
          @mouseover="showChooseBorder('Maintained', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Maintained" placement="top-start">
              <el-text size="small" line-clamp="3">Maintained</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(projects[idx - 1].scorecard.maintained, 'scorecard.maintained'),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.maintained) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.ciiBestPractices')"
          class="row"
          @mouseover="showChooseBorder('CII-Best-Practices', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="CII-Best-Practices" placement="top-start">
              <el-text size="small" line-clamp="3">CII-Best-Practices</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(
                    projects[idx - 1].scorecard.ciiBestPractices,
                    'scorecard.ciiBestPractices',
                  ),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.ciiBestPractices) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.license')"
          class="row"
          @mouseover="showChooseBorder('License', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="License" placement="top-start">
              <el-text size="small" line-clamp="3">License</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{ good: isGood(projects[idx - 1].scorecard.license, 'scorecard.license') }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.license) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.securityPolicy')"
          class="row"
          @mouseover="showChooseBorder('Security-Policy', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Security-Policy" placement="top-start">
              <el-text size="small" line-clamp="3">Security-Policy</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(
                    projects[idx - 1].scorecard.securityPolicy,
                    'scorecard.securityPolicy',
                  ),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.securityPolicy) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.dangerousWorkflow')"
          class="row"
          @mouseover="showChooseBorder('Dangerous-Workflow', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Dangerous-Workflow" placement="top-start">
              <el-text size="small" line-clamp="3">Dangerous-Workflow</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(
                    projects[idx - 1].scorecard.dangerousWorkflow,
                    'scorecard.dangerousWorkflow',
                  ),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.dangerousWorkflow) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.branchProtection')"
          class="row"
          @mouseover="showChooseBorder('Branch-Protection', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Branch-Protection" placement="top-start">
              <el-text size="small" line-clamp="3">Branch-Protection</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(
                    projects[idx - 1].scorecard.branchProtection,
                    'scorecard.branchProtection',
                  ),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.branchProtection) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.tokenPermissions')"
          class="row"
          @mouseover="showChooseBorder('Token-Permissions', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Token-Permissions" placement="top-start">
              <el-text size="small" line-clamp="3">Token-Permissions</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(
                    projects[idx - 1].scorecard.tokenPermissions,
                    'scorecard.tokenPermissions',
                  ),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.tokenPermissions) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.binaryArtifacts')"
          class="row"
          @mouseover="showChooseBorder('Binary-Artifacts', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Binary-Artifacts" placement="top-start">
              <el-text size="small" line-clamp="3">Binary-Artifacts</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(
                    projects[idx - 1].scorecard.binaryArtifacts,
                    'scorecard.binaryArtifacts',
                  ),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.binaryArtifacts) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.fuzzing')"
          class="row"
          @mouseover="showChooseBorder('Fuzzing', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Fuzzing" placement="top-start">
              <el-text size="small" line-clamp="3">Fuzzing</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{ good: isGood(projects[idx - 1].scorecard.fuzzing, 'scorecard.fuzzing') }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.fuzzing) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.sast')"
          class="row"
          @mouseover="showChooseBorder('SAST', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="SAST" placement="top-start">
              <el-text size="small" line-clamp="3">SAST</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{ good: isGood(projects[idx - 1].scorecard.sast, 'scorecard.sast') }">
                {{ formatFloat(projects[idx - 1].scorecard.sast) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.vulnerabilities')"
          class="row"
          @mouseover="showChooseBorder('Vulnerabilities', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Vulnerabilities" placement="top-start">
              <el-text size="small" line-clamp="3">Vulnerabilities</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(
                    projects[idx - 1].scorecard.vulnerabilities,
                    'scorecard.vulnerabilities',
                  ),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.vulnerabilities) }} / 10
              </span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('scorecard.pinnedDependencies')"
          class="row"
          @mouseover="showChooseBorder('Pinned-Dependencies', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Pinned-Dependencies" placement="top-start">
              <el-text size="small" line-clamp="3">Pinned-Dependencies</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span
                :class="{
                  good: isGood(
                    projects[idx - 1].scorecard.pinnedDependencies,
                    'scorecard.pinnedDependencies',
                  ),
                }"
              >
                {{ formatFloat(projects[idx - 1].scorecard.pinnedDependencies) }} / 10
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-show="showQuality" key="2" style="display: flex">
      <div
        class="border-left border-top"
        style="
          width: 22px;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          text-align: center;
        "
      >
        SonarCloud Scan
      </div>
      <div style="flex: 1">
        <div
          v-show="getShowRow('sonarCloudScan.reliabilityRating')"
          class="row"
          @mouseover="showChooseBorder('Reliability', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Reliability" placement="top-start">
              <el-text size="small" line-clamp="3">Reliability</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <div
                class="w-30px h-30px border-rd-50% text-center"
                :style="{
                  backgroundColor: getLevelColor(
                    projects[idx - 1].sonarCloudScan?.reliabilityRating,
                  ),
                }"
              >
                <span vertical-middle color-white>{{
                  formatString(projects[idx - 1].sonarCloudScan?.reliabilityRating)
                }}</span>
              </div>
              <span>{{ formatNumber(projects[idx - 1].sonarCloudScan?.bugs) }} Bugs</span>
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('sonarCloudScan.maintainabilityRating')"
          class="row"
          @mouseover="showChooseBorder('Maintainability', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Maintainability" placement="top-start">
              <el-text size="small" line-clamp="2">Maintainability</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <div
                class="w-30px h-30px border-rd-50% text-center"
                :style="{
                  backgroundColor: getLevelColor(
                    projects[idx - 1].sonarCloudScan?.maintainabilityRating,
                  ),
                }"
              >
                <span vertical-middle color-white>{{
                  formatString(projects[idx - 1].sonarCloudScan?.maintainabilityRating)
                }}</span>
              </div>
              <span
                >{{ formatNumber(projects[idx - 1].sonarCloudScan?.codeSmells) }} Code Smells</span
              >
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('sonarCloudScan.securityRating')"
          class="row"
          @mouseover="showChooseBorder('Security', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Security" placement="top-start">
              <el-text size="small" line-clamp="3">Security</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <div
                class="w-30px h-30px border-rd-50% text-center"
                :style="{
                  backgroundColor: getLevelColor(projects[idx - 1].sonarCloudScan?.securityRating),
                }"
              >
                <span vertical-middle color-white>{{
                  formatString(projects[idx - 1].sonarCloudScan?.securityRating)
                }}</span>
              </div>
              <span
                >{{
                  formatNumber(projects[idx - 1].sonarCloudScan?.vulnerabilities)
                }}
                Vulnerabilities</span
              >
            </div>
          </div>
        </div>
        <div
          v-show="getShowRow('sonarCloudScan.securityReviewRating')"
          class="row"
          @mouseover="showChooseBorder('Security Review', $event)"
          @mouseout="hideChooseBorder($event)"
        >
          <div class="border param-name" style="width: 97px">
            <el-tooltip content="Security Review" placement="top-start">
              <el-text size="small" line-clamp="3">Security Review</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <div
                class="w-30px h-30px border-rd-50% text-center"
                :style="{
                  backgroundColor: getLevelColor(
                    projects[idx - 1].sonarCloudScan?.securityReviewRating,
                  ),
                }"
              >
                <span vertical-middle color-white>{{
                  formatString(projects[idx - 1].sonarCloudScan?.securityReviewRating)
                }}</span>
              </div>
              <span
                >{{ formatNumber(projects[idx - 1].sonarCloudScan?.securityHotspots) }} Security
                Hotspots</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    </TransitionGroup>

    <div class="border categar" @click="showEcology = !showEcology">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown v-show="showEcology" />
        <ArrowRight v-show="!showEcology" />
      </el-icon>
      生态
    </div>

    <TransitionGroup name="list" tag="div" class="overflow-hidden">
    <div
      v-show="showEcology"
      key="1"
      class="row"
      @mouseover="showChooseBorder('成熟度', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">成熟度</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <div
            v-show="getShowRow('ecologyOverview.downloads')"
            style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            "
          >
            <span style="text-align: center; font-weight: bold"
              >{{ toKilo(projects[idx - 1].ecologyOverview.downloads).split('.')[0] }} k</span
            >
            <div style="display: inline-flex">
              <div i-custom:download font-size-6 mr-4 />
              <div>npm周下载量</div>
            </div>
          </div>

          <div
            v-show="getShowRow('ecologyOverview.stargazersCount')"
            style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            "
          >
            <span style="text-align: center; font-weight: bold"
              >{{ toKilo(projects[idx - 1].ecologyOverview.stargazersCount) }} k</span
            >
            <div style="display: inline-flex">
              <div i-custom:star font-size-6 mr-4 />
              <div>Star数量</div>
            </div>
          </div>

          <div
            v-show="getShowRow('ecologyOverview.forksCount')"
            style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            "
          >
            <span style="text-align: center; font-weight: bold"
              >{{ toKilo(projects[idx - 1].ecologyOverview.forksCount) }} k</span
            >
            <div style="display: inline-flex">
              <div i-custom:fork font-size-6 mr-4 />
              <div>Fork数量</div>
            </div>
          </div>

          <div
            v-show="getShowRow('ecologyOverview.busFactor')"
            style="width: 160px; display: flex; flex-direction: column; justify-content: center"
          >
            <span style="text-align: center; font-weight: bold">{{
              formatFloat(projects[idx - 1].ecologyOverview.busFactor)
            }}</span>
            <div style="display: inline-flex">
              <div i-custom:bus font-size-6 mr-4 />
              <div>巴士系数</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-show="showEcology"
      key="2"
      class="row"
      @mouseover="showChooseBorder('影响力', $event)"
      @mouseout="hideChooseBorder($event)"
    >
      <div class="border param-name">影响力</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <div
            v-show="getShowRow('ecologyOverview.openRank')"
            style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            "
          >
            <span style="text-align: center; font-weight: bold">{{
              formatFloat(projects[idx - 1].ecologyOverview.openRank)
            }}</span>
            <div style="display: inline-flex">
              <div i-custom:medal font-size-6 mr-4 />
              <div>OpenRank得分</div>
            </div>
          </div>

          <div
            v-show="getShowRow('ecologyOverview.criticalityScore')"
            style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            "
          >
            <span style="text-align: center; font-weight: bold">{{
              formatFloat(projects[idx - 1].ecologyOverview.criticalityScore)
            }}</span>
            <div style="display: inline-flex">
              <div i-custom:trophy font-size-6 mr-4 />
              <div>Criticality得分</div>
            </div>
          </div>

          <div
            v-show="getShowRow('ecologyOverview.contributorCount')"
            style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            "
          >
            <span style="text-align: center; font-weight: bold">{{
              formatNumber(projects[idx - 1].ecologyOverview.contributorCount)
            }}</span>
            <div style="display: inline-flex">
              <div i-custom:contributor font-size-6 mr-4 />
              <div>贡献者数量</div>
            </div>
          </div>

          <div
            v-show="getShowRow('ecologyOverview.dependentCount')"
            style="width: 160px; display: flex; flex-direction: column; justify-content: center"
          >
            <span style="text-align: center; font-weight: bold">{{
              formatNumber(projects[idx - 1].ecologyOverview.dependentCount)
            }}</span>
            <div style="display: inline-flex">
              <div i-custom:link font-size-6 mr-4 />
              <div>被依赖数量</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </TransitionGroup>

    <div ref="tipDiv" style="background-color: lightblue; position: absolute; display: none"></div>
  </div>
</template>

<style scoped lang="less">
@border-color: #e6e6e6;

.main {
  width: 1280px;
  margin: 20px auto;
  border-top: 1px @border-color solid;
  border-left: 1px @border-color solid;

  .menu {
    height: 50px;
    display: inline-block;
    padding: 0px 18px;
    line-height: 50px;
    cursor: pointer;

    &:hover {
      background-color: #1579d1;
    }
  }

  .selected {
    background-color: #1579d1;
  }

  .row {
    display: flex;
    position: relative;
    background-color: #ffffff;

    &:hover {
      border: 1px solid #198ef6;
    }

    .param-name {
      width: 119px;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .param-value {
      width: 232px;
      padding: 10px 10px;

      .value-div {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;

        .description {
          padding: 10px;
          max-height: 85px;
        }

        .close-btn {
          position: absolute;
          top: -6px;
          right: 0px;
        }

        .switch-btn {
          position: absolute;
          top: calc(50% - 16px);
          right: -26px;
        }

        .good {
          &::after {
            content: '  ';
            display: inline-block;
            width: 16px;
            height: 16px;
            margin-left: 10px;
            background-image: url('data:image/svg+xml;base64,PHN2ZyB0PSIxNzEwOTIzMjQ0Njc2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjUwNTQiIGlkPSJteF9uXzE3MTA5MjMyNDQ2NzciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTIyNC4xNiAzOTEuMzZ2NjEwLjA4SDkzLjQ0QzQxLjkyIDEwMDEuNDQgMCA5NjAgMCA5MDkuMjhWNDgzLjM2YzAtNTAuNzIgNDEuOTItOTIgOTMuNDQtOTJoMTMwLjcyek0xMDA2LjA4IDU3My40NGMtMy44NCA2LjcyLTcuNTIgMTIuNjQtMTAuODggMTguMDgtMTYuMTYgMjYuNzItMjIuNCAzNi44LTIwLjMyIDY5LjkyIDAuNDggMTAuMDggMS45MiAyMC4zMiAzLjM2IDMwLjQgNS4yOCAzOS4zNiAxMiA4OC4xNi0yNi4yNCAxMzMuNzYtMjUuOTIgMzEuMzYtMjkuNDQgNDguOC0zMS44NCA2MC40OC0xLjEyIDUuNDQtMi4yNCAxMS4yLTUuMTIgMTYuOTYtMzIuMTYgNjMuNjgtOTAuNTYgOTguNC0xNjUuMjggOTguNEgyNzIuMTZWMzkxLjM2aDI3LjUyYzI5LjI4IDAgOTQuMjQtNjEuNDQgMTU3Ljc2LTE0OS4yOCAyNC4xNi0zMy4yOCAyNC4xNi00MS4xMiAyNC4xNi0xMDEuOTJDNDgxLjYgNjEuNiA1MzMuOTIgMCA2MDAuNjQgMGM2MC4zMiAwIDEzMC41NiAzNC41NiAxMzAuNTYgMTMxLjY4IDAgNTguODgtMTcuNiAxNjguNDgtMjYuNzIgMjIwLjk2IDM0Ljg4LTAuOCA5NC40LTEuOTIgMTQ4LjQ4LTEuOTIgNjMuODQgMCAxMjAuMTYgMzAuNzIgMTUwLjU2IDgyLjQgMjYuNCA0NC45NiAyNy4zNiA5Ny40NCAyLjU2IDE0MC4zMnoiIHAtaWQ9IjUwNTUiIGZpbGw9IiNkNDIzN2EiPjwvcGF0aD48L3N2Zz4=');
          }
        }
      }

      .none-project-div {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
      }
    }
  }

  .categar {
    height: 38px;
    background-color: #fafafa;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .page-title {
    background-color: #409eff;
    color: white;
    padding: 0px 0px;
  }

  .border {
    border-bottom: 1px @border-color solid;
    border-right: 1px @border-color solid;
  }

  .border-right {
    border-right: 1px @border-color solid;
  }

  .border-left {
    border-left: 1px @border-color solid;
  }

  .border-top {
    border-top: 1px @border-color solid;
  }

  .project {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
  }
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-486px);
}
</style>
