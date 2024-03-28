<script setup lang="ts">
import { Close, Switch, ArrowDown } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import type { SoftwareInfo } from '@/api/SoftwareDetails';
import { getSoftwareInfo } from '@/api/SoftwareDetails';
import { toKilo, getLevelColor } from '@/api/utils';

const prop = defineProps({
  repositories: {
    type: Array<string>,
    required: true,
  },
});

const projects = reactive<Array<SoftwareInfo>>([]);
prop.repositories.forEach(repoName => {
  const encodedRepoName = encodeURIComponent(repoName);
  getSoftwareInfo(encodedRepoName)
    .then((data: { [x: string]: any }) => {
    projects.push(data['data']);
  }).catch((error: any) => {
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

    parent = parent.parentNode;
  }

  return null;
};

const tipDiv = ref<HTMLElement | null>(null);
function showChooseBorder(title: string, event: MouseEvent) {
  const row = findRow(event.target, 'row');
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
</script>

<template>
  <div class="main">
    <div class="page-title">
      <span class="menu selected">开源软件对比</span>
      <span class="menu">Benchmark</span>
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
            <span>{{ projects[idx - 1]?.repoName }}</span>
            <el-icon class="close-btn">
              <Close />
            </el-icon>
            <el-button v-if="idx < projects.length" class="switch-btn" :icon="Switch" circle />
          </div>
          <div v-else class="none-project-div">
            <el-select style="width: 80%" placeholder="选择开源软件"> </el-select>
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
    <div class="row" @mouseover="showChooseBorder('技术栈', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">技术栈</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <el-link type="primary">{{ projects[idx - 1].techStack }}</el-link>
        </div>
      </div>
    </div>

    <div class="row" @mouseover="showChooseBorder('功能', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">
        <span i-custom:function mr-2 />
        <span>功能</span>
      </div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span :class="{
      good: isGood(projects[idx - 1].evaluation.functionScore, 'evaluation.functionScore'),
    }">{{ projects[idx - 1].evaluation.functionScore }}/100</span>
        </div>
      </div>
    </div>
    <div class="row" @mouseover="showChooseBorder('性能', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">
        <span i-custom:performance mr-2 />
        <span>性能</span>
      </div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span :class="{
      good: isGood(
        projects[idx - 1].evaluation.performanceScore,
        'evaluation.performanceScore',
      ),
    }">
            {{ projects[idx - 1].evaluation.performanceScore }}/100
          </span>
        </div>
      </div>
    </div>
    <div class="row" @mouseover="showChooseBorder('质量', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">
        <span i-custom:quality mr-2 />
        <span>质量</span>
      </div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span :class="{
      good: isGood(projects[idx - 1].evaluation.qualityScore, 'evaluation.qualityScore'),
    }">
            {{ projects[idx - 1].evaluation.qualityScore }}/100
          </span>
        </div>
      </div>
    </div>
    <div class="row" @mouseover="showChooseBorder('生态', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">
        <span i-custom:ecology mr-2 />
        <span>生态</span>
      </div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span :class="{
      good: isGood(projects[idx - 1].evaluation.ecologyScore, 'evaluation.ecologyScore'),
    }">
            {{ projects[idx - 1].evaluation.ecologyScore }}/100
          </span>
        </div>
      </div>
    </div>

    <div class="border categar">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown />
      </el-icon>
      基本信息
    </div>
    <div class="row" @mouseover="showChooseBorder('Stars', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">Stars</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span style="color: #409eff" :class="{ good: isStarTop(projects[idx - 1].star) }">{{
      toKilo(projects[idx - 1].star)
    }}</span>
        </div>
      </div>
    </div>
    <div class="row" @mouseover="showChooseBorder('开发语言', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">开发语言</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span>{{ projects[idx - 1].language }}</span>
        </div>
      </div>
    </div>
    <div class="row" @mouseover="showChooseBorder('代码量', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">代码量</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span>{{ projects[idx - 1].codeLines }} (KL)</span>
        </div>
      </div>
    </div>

    <div class="row" @mouseover="showChooseBorder('首次提交', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">首次提交</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span> {{ dayjs(projects[idx - 1].firstCommit).format('YYYY-MM-DD') }} </span>
        </div>
      </div>
    </div>
    <div class="row" @mouseover="showChooseBorder('License', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">License</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <span> {{ projects[idx - 1].license }} </span>
        </div>
      </div>
    </div>

    <div class="border categar">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown />
      </el-icon>
      功能
    </div>
    <div class="row" @mouseover="showChooseBorder('开发者满意度', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">开发者满意度</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div" style="">
          <span v-for="value in projects[idx - 1].satisfaction" :key="value.year">
            {{ value.year }} : {{ value.val }}%
          </span>
          <span v-if="!projects[idx - 1].satisfaction.length">NA</span>
        </div>
      </div>
    </div>

    <div class="row" @mouseover="showChooseBorder('文档最佳实践', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">文档最佳实践</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <div>
            <div style="text-align: center; margin-bottom: 8px">
              {{ projects[idx - 1].document.documentScore }}%
            </div>
            <div>
              <span v-if="projects[idx - 1].document.hasReadme" i-ph-check-circle mr-1 font-size-5 color-green-300 />
              <span v-else i-ph-minus-circle mr-1 font-size-5 color-gray-400 />
              Readme
            </div>
            <div>
              <span v-if="projects[idx - 1].document.hasWebsite" i-ph-check-circle mr-1 font-size-5 color-green-300 />
              <span v-else i-ph-minus-circle mr-1 font-size-5 color-gray-400 />
              Website
            </div>
            <div>
              <span v-if="projects[idx - 1].document.hasChangelog" i-ph-check-circle mr-1 font-size-5 color-green-300 />
              <span v-else i-ph-minus-circle mr-1 font-size-5 color-gray-400 />
              Changelog
            </div>
            <div>
              <span v-if="projects[idx - 1].document.hasContributing" i-ph-check-circle mr-1 font-size-5
                color-green-300 />
              <span v-else i-ph-minus-circle mr-1 font-size-5 color-gray-400 />
              Governance
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="border categar">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown />
      </el-icon>
      性能
    </div>
    <div class="row" @mouseover="showChooseBorder('Benchmark Score', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name" style="height: 60px; font-size: 14px">Benchmark Score</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">NA</div>
      </div>
    </div>

    <div class="border categar">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown />
      </el-icon>
      质量
    </div>
    <div style="display: flex">
      <div class="border-left border-top" style="
          width: 22px;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          text-align: center;
        ">
        OpenSSF Scorecard
      </div>
      <div style="flex: 1">
        <div class="row" @mouseover="showChooseBorder('Score', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Score" placement="top-start">
              <el-text size="small" line-clamp="3">Score</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{ good: isGood(projects[idx - 1].scorecard.score, 'scorecard.score') }">
                {{ projects[idx - 1].scorecard.score }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Code-Review', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Code-Review" placement="top-start">
              <el-text size="small" line-clamp="3">Code-Review</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(projects[idx - 1].scorecard.codeReview, 'scorecard.codeReview'),
    }">
                {{ projects[idx - 1].scorecard.codeReview }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Maintained', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Maintained" placement="top-start">
              <el-text size="small" line-clamp="3">Maintained</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(projects[idx - 1].scorecard.maintained, 'scorecard.maintained'),
    }">
                {{ projects[idx - 1].scorecard.maintained }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('CII-Best-Practices', $event)"
          @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="CII-Best-Practices" placement="top-start">
              <el-text size="small" line-clamp="3">CII-Best-Practices</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(
        projects[idx - 1].scorecard.ciiBestPractices,
        'scorecard.ciiBestPractices',
      ),
    }">
                {{ projects[idx - 1].scorecard.ciiBestPractices }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('License', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="License" placement="top-start">
              <el-text size="small" line-clamp="3">License</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{ good: isGood(projects[idx - 1].scorecard.license, 'scorecard.license') }">
                {{ projects[idx - 1].scorecard.license }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Security-Policy', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Security-Policy" placement="top-start">
              <el-text size="small" line-clamp="3">Security-Policy</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(
        projects[idx - 1].scorecard.securityPolicy,
        'scorecard.securityPolicy',
      ),
    }">
                {{ projects[idx - 1].scorecard.securityPolicy }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Dangerous-Workflow', $event)"
          @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Dangerous-Workflow" placement="top-start">
              <el-text size="small" line-clamp="3">Dangerous-Workflow</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(
        projects[idx - 1].scorecard.dangerousWorkflow,
        'scorecard.dangerousWorkflow',
      ),
    }">
                {{ projects[idx - 1].scorecard.dangerousWorkflow }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Branch-Protection', $event)"
          @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Branch-Protection" placement="top-start">
              <el-text size="small" line-clamp="3">Branch-Protection</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(
        projects[idx - 1].scorecard.branchProtection,
        'scorecard.branchProtection',
      ),
    }">
                {{ projects[idx - 1].scorecard.branchProtection }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Token-Permissions', $event)"
          @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Token-Permissions" placement="top-start">
              <el-text size="small" line-clamp="3">Token-Permissions</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(
        projects[idx - 1].scorecard.tokenPermissions,
        'scorecard.tokenPermissions',
      ),
    }">
                {{ projects[idx - 1].scorecard.tokenPermissions }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Binary-Artifacts', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Binary-Artifacts" placement="top-start">
              <el-text size="small" line-clamp="3">Binary-Artifacts</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(
        projects[idx - 1].scorecard.binaryArtifacts,
        'scorecard.binaryArtifacts',
      ),
    }">
                {{ projects[idx - 1].scorecard.binaryArtifacts }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Fuzzing', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Fuzzing" placement="top-start">
              <el-text size="small" line-clamp="3">Fuzzing</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{ good: isGood(projects[idx - 1].scorecard.fuzzing, 'scorecard.fuzzing') }">
                {{ projects[idx - 1].scorecard.fuzzing }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('SAST', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="SAST" placement="top-start">
              <el-text size="small" line-clamp="3">SAST</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{ good: isGood(projects[idx - 1].scorecard.sast, 'scorecard.sast') }">
                {{ projects[idx - 1].scorecard.sast }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Vulnerabilities', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Vulnerabilities" placement="top-start">
              <el-text size="small" line-clamp="3">Vulnerabilities</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(
        projects[idx - 1].scorecard.vulnerabilities,
        'scorecard.vulnerabilities',
      ),
    }">
                {{ projects[idx - 1].scorecard.vulnerabilities }} / 10
              </span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Pinned-Dependencies', $event)"
          @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Pinned-Dependencies" placement="top-start">
              <el-text size="small" line-clamp="3">Pinned-Dependencies</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <span :class="{
      good: isGood(
        projects[idx - 1].scorecard.pinnedDependencies,
        'scorecard.pinnedDependencies',
      ),
    }">
                {{ projects[idx - 1].scorecard.pinnedDependencies }} / 10
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="display: flex">
      <div class="border-left border-top" style="
          width: 22px;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          text-align: center;
        ">
        SonarCloud Scan
      </div>
      <div style="flex: 1">
        <div class="row" @mouseover="showChooseBorder('Reliability', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Reliability" placement="top-start">
              <el-text size="small" line-clamp="3">Reliability</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <div class="w-30px h-30px border-rd-50% text-center"
                   :style="{ backgroundColor: getLevelColor(projects[idx - 1].sonarCloudScan?.reliabilityRating) }">
                <span vertical-middle color-white>{{
      toKilo(projects[idx - 1].sonarCloudScan?.reliabilityRating)
    }}</span>
              </div>
              <span>{{ toKilo(projects[idx - 1].sonarCloudScan?.bugs) }} Bugs</span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Maintainability', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Maintainability" placement="top-start">
              <el-text size="small" line-clamp="2">Maintainability</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <div class="w-30px h-30px border-rd-50% text-center"
                   :style="{ backgroundColor: getLevelColor(projects[idx - 1].sonarCloudScan?.maintainabilityRating) }">
                <span vertical-middle color-white>{{
      toKilo(projects[idx - 1].sonarCloudScan?.maintainabilityRating)
    }}</span>
              </div>
              <span>{{ toKilo(projects[idx - 1].sonarCloudScan?.codeSmells) }} Code Smells</span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Security', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Security" placement="top-start">
              <el-text size="small" line-clamp="3">Security</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <div class="w-30px h-30px border-rd-50% text-center"
                   :style="{ backgroundColor: getLevelColor(projects[idx - 1].sonarCloudScan?.securityRating) }">
                <span vertical-middle color-white>{{
      toKilo(projects[idx - 1].sonarCloudScan?.securityRating)
    }}</span>
              </div>
              <span>{{
        toKilo(projects[idx - 1].sonarCloudScan?.vulnerabilities)
      }}
                Vulnerabilities</span>
            </div>
          </div>
        </div>
        <div class="row" @mouseover="showChooseBorder('Security Review', $event)" @mouseout="hideChooseBorder($event)">
          <div class="border param-name" style="width: 57px">
            <el-tooltip content="Security Review" placement="top-start">
              <el-text size="small" line-clamp="3">Security Review</el-text>
            </el-tooltip>
          </div>
          <div v-for="idx in 5" :key="idx" class="param-value border">
            <div v-if="projects[idx - 1]" class="value-div">
              <div class="w-30px h-30px border-rd-50% text-center"
                   :style="{ backgroundColor: getLevelColor(projects[idx - 1].sonarCloudScan?.securityReviewRating) }">
                <span vertical-middle color-white>{{
      toKilo(projects[idx - 1].sonarCloudScan?.securityReviewRating)
    }}</span>
              </div>
              <span>{{ toKilo(projects[idx - 1].sonarCloudScan?.securityHotspots) }} Security
                Hotspots</span>

            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="border categar">
      <el-icon style="color: cornflowerblue; margin: 0px 6px">
        <ArrowDown />
      </el-icon>
      生态
    </div>

    <div class="row" @mouseover="showChooseBorder('成熟度', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">成熟度</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <div style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            ">
            <span style="text-align: center; font-weight: bold">{{
      toKilo(projects[idx - 1].ecologyOverview.downloads)
    }}</span>
            <div style="display: inline-flex">
              <div i-custom:download font-size-6 mr-4 />
              <div>npm周下载量</div>
            </div>
          </div>

          <div style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            ">
            <span style="text-align: center; font-weight: bold">{{
        toKilo(projects[idx - 1].ecologyOverview.stargazersCount)
      }}</span>
            <div style="display: inline-flex">
              <div i-custom:star font-size-6 mr-4 />
              <div>Star数量</div>
            </div>
          </div>

          <div style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            ">
            <span style="text-align: center; font-weight: bold">{{
        toKilo(projects[idx - 1].ecologyOverview.forksCount)
      }}</span>
            <div style="display: inline-flex">
              <div i-custom:fork font-size-6 mr-4 />
              <div>Fork数量</div>
            </div>
          </div>

          <div style="width: 160px; display: flex; flex-direction: column; justify-content: center">
            <span style="text-align: center; font-weight: bold">{{
        projects[idx - 1].ecologyOverview.busFactor
      }}</span>
            <div style="display: inline-flex">
              <div i-custom:bus font-size-6 mr-4 />
              <div>巴士系数</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row" @mouseover="showChooseBorder('影响力', $event)" @mouseout="hideChooseBorder($event)">
      <div class="border param-name">影响力</div>
      <div v-for="idx in 5" :key="idx" class="param-value border">
        <div v-if="projects[idx - 1]" class="value-div">
          <div style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            ">
            <span style="text-align: center; font-weight: bold">{{
      projects[idx - 1].ecologyOverview.openRank
    }}</span>
            <div style="display: inline-flex">
              <div i-custom:medal font-size-6 mr-4 />
              <div>OpenRank得分</div>
            </div>
          </div>

          <div style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            ">
            <span style="text-align: center; font-weight: bold">{{
        projects[idx - 1].ecologyOverview.criticalityScore
      }}</span>
            <div style="display: inline-flex">
              <div i-custom:trophy font-size-6 mr-4 />
              <div>Criticality得分</div>
            </div>
          </div>

          <div style="
              width: 160px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin-bottom: 10px;
            ">
            <span style="text-align: center; font-weight: bold">{{
        projects[idx - 1].ecologyOverview.contributorCount
      }}</span>
            <div style="display: inline-flex">
              <div i-custom:contributor font-size-6 mr-4 />
              <div>贡献者数量</div>
            </div>
          </div>

          <div style="width: 160px; display: flex; flex-direction: column; justify-content: center">
            <span style="text-align: center; font-weight: bold">{{
        projects[idx - 1].ecologyOverview.dependentCount
      }}</span>
            <div style="display: inline-flex">
              <div i-custom:link font-size-6 mr-4 />
              <div>被依赖数量</div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
      width: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .param-value {
      width: 240px;
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
</style>
