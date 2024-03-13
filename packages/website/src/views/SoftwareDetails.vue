<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import {
  EcologyActivity,
  EcologyActivityCategory,
  EcologyOverview,
  getBaseInfo,
  getEcologyActivityCategoryApi,
  getEcologyOverviewApi,
  getFunctionModuleInfo,
  getPerformanceModuleInfo,
  getQualityModuleInfo,
} from '@api/SoftwareDetails';

const route = useRoute();

function toKilo(num: number) {
  return Math.floor(num / 1000);
}

const repoName = ref(String(route.query.repoName ?? ''));

type TableRow = {
  label: string;
  value: string | number;
};

const baseInfo = reactive({
  logo: '',
  description: '',
  tags: [] as Array<string>,
  tableData: [] as Array<TableRow>,
  evaluation: {
    functionScore: 0,
    qualityScore: 0,
    performanceScore: 0,
    ecologyScore: 0,
    innovationValue: 0,
  },
});
const overviewLoading = ref(true);

getBaseInfo(encodeURIComponent(repoName.value))
  .then(({ data }) => {
    baseInfo.logo = data.logo;
    baseInfo.description = data.description;
    baseInfo.tags = data.tags ? data.tags.split('|') : [];
    baseInfo.tableData = [
      {
        label: 'Stars',
        value: data.star,
      },
      {
        label: '开发语言',
        value: data.language,
      },
      {
        label: '代码量',
        value: data.codeLines,
      },
      {
        label: '首次提交',
        value: dayjs(data.firstCommit).format('YYYY-MM-DD'),
      },
      {
        label: 'License',
        value: data.license,
      },
    ];
    baseInfo.evaluation = data.evaluation;
  })
  .then(() => {
    renderSoftwareRadarChart();
  })
  .finally(() => {
    overviewLoading.value = false;
  });

function tagType(idx: number) {
  const remainder = idx % 4;
  switch (remainder) {
    case 0:
      return 'primary';
    case 1:
      return 'success';
    case 2:
      return 'warning';
    case 3:
      return 'danger';
  }
}

const softwareDetailsEl = ref();

function renderSoftwareRadarChart() {
  const chartDom = softwareDetailsEl.value?.querySelector('#software-radar-chart');
  if (!chartDom) {
    return;
  }
  const chart = echarts.init(chartDom);
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    radar: {
      indicator: [
        { name: '功能', max: 100 },
        { name: '质量', max: 100 },
        { name: '性能', max: 100 },
        { name: '生态', max: 100 },
        { name: '创新', max: 100 },
      ],
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              baseInfo.evaluation.functionScore,
              baseInfo.evaluation.qualityScore,
              baseInfo.evaluation.performanceScore,
              baseInfo.evaluation.ecologyScore,
              baseInfo.evaluation.innovationValue,
            ],
            name: '分数',
          },
        ],
        tooltip: {
          trigger: 'item',
        },
        areaStyle: {},
      },
    ],
  };
  chart.setOption(option);
}

const developerSatisfaction = ref({
  xAxis: [] as Array<number>,
  yAxis: [] as Array<number>,
});
const documentInfo = ref<{
  score: number;
  items: Array<{
    title: string;
    content: string;
    has: boolean;
  }>;
}>({
  score: 0,
  items: [],
});

getFunctionModuleInfo(encodeURIComponent(repoName.value))
  .then(({ data }) => {
    developerSatisfaction.value = data.satisfaction;
    documentInfo.value = {
      score: data.document.documentScore,
      items: [
        {
          title: 'Readme',
          content: 'The readme file introduces and explains a project. It contains information that is commonly required to understand what the project is about.',
          has: data.document.hasReadme,
        },
        {
          title: 'Website',
          content: 'A url that users can visit to learn more about your project.',
          has: data.document.hasWebsite,
        },
        {
          title: 'Changelog',
          content: 'A curated, chronologically ordered list of notable changes for each version.',
          has: data.document.hasChangelog,
        },
        {
          title: 'Governance',
          content: 'Document that explains how the governance and committer process works in the repository.',
          has: data.document.hasContributing,
        },

      ],
    };
  })
  .then(() => {
    renderGithubStartChart();
    renderDeveloperSatisfactionChart();
    renderDocBestPracticesChart();
  });

function renderGithubStartChart() {
  const chartDom = softwareDetailsEl.value.querySelector('#github-start-chart');
  if (!chartDom) {
    return;
  }
  const chart = echarts.init(chartDom);
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['2016', '2017', '2018', '2019', '2020', '2021', '2022'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: [20, 30, 60, 80, 60, 30, 20],
        type: 'line',
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
    },
  };
  chart.setOption(option);
}

function renderDeveloperSatisfactionChart() {
  const chartDom = softwareDetailsEl.value?.querySelector('#developer-satisfaction-chart');
  if (!chartDom) {
    return;
  }
  const chart = echarts.init(chartDom);
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: developerSatisfaction.value.xAxis,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: developerSatisfaction.value.yAxis,
        type: 'line',
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
    },
  };
  chart.setOption(option);
}

function renderDocBestPracticesChart() {
  const chartDom = softwareDetailsEl.value?.querySelector('#doc-best-practices-chart');
  if (!chartDom) {
    return;
  }
  const chart = echarts.init(chartDom);
  const option: echarts.EChartsOption = {
    series: [
      {
        type: 'gauge',
        axisLine: {
          lineStyle: {
            width: 10,
            color: [
              [0.25, '#de4716'],
              [0.5, '#de7700'],
              [0.75, '#deac16'],
              [1, '#0bdeab'],
            ],
          },
        },
        startAngle: 180,
        endAngle: 360,
        radius: '100%',
        center: ['45%', '70%'],
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: 'inherit',
          fontSize: 20,
        },
        data: [
          {
            value: documentInfo.value.score || 0,
          },
        ],
      },
    ],
  };
  chart.setOption(option);
}

const performanceModuleInfo = ref({
  size: 0,
  gzipSize: 0,
  benchmarkScore: 0,
});

getPerformanceModuleInfo(encodeURIComponent(repoName.value)).then(({ data }) => {
  performanceModuleInfo.value = data;
});

const openSSFScordcard = ref<{
  score: number;
  items: Array<{
    label: string;
    value: number;
  }>;
}>({
  score: 0,
  items: [],
});

const sonarCloudScan = ref({
  bug: 1,
  codeSmells: 494,
  vulnerabilities: 0,
  securityHotspots: 14,
  reviewed: '0.0%',
  reliabilityLevel: 'C',
  maintainabilityLevel: 'A',
  securityLevel: 'A',
  securityReviewLevel: 'E',
});

getQualityModuleInfo(encodeURIComponent(repoName.value)).then(({ data }) => {
  const scorecard = data.scorecard;
  openSSFScordcard.value = {
    score: scorecard.score,
    items: [
    {
        label: 'Code-Review',
        value: scorecard.codeReview,
      },
      {
        label: 'Maintained',
        value: scorecard.maintained,
      },
      {
        label: 'CII-Best-Practices',
        value: scorecard.ciiBestPractices,
      },
      {
        label: 'License',
        value: scorecard.license,
      },
      {
        label: 'Security-Policy',
        value: scorecard.securityPolicy,
      },
      {
        label: 'Dangerous-Workflow',
        value: scorecard.dangerousWorkflow,
      },
      {
        label: 'Branch-Protection',
        value: scorecard.branchProtection,
      },
      {
        label: 'Token-Permissions',
        value: scorecard.tokenPermissions,
      },
      {
        label: 'Binary-Artifacts',
        value: scorecard.binaryArtifacts,
      },
      {
        label: 'Fuzzing',
        value: scorecard.fuzzing,
      },
      {
        label: 'SAST',
        value: scorecard.sast,
      },
      {
        label: 'Vulnerabilities',
        value: scorecard.vulnerabilities,
      },
      {
        label: 'Pinned-Dependencies',
        value: scorecard.pinnedDependencies,
      },
    ],
  };
});

function scorecardProgressColor(score: number) {
  if (score < 2) {
    return '#f43146';
  } else if (score < 5) {
    return '#ec6f1a';
  } else if (score < 8) {
    return '#eeba18';
  } else {
    return '#2da769';
  }
}

function renderLineChart(container: string, data: EcologyActivity[]) {
  const chartDom = softwareDetailsEl.value.querySelector(container);
  if (!chartDom) {
    return;
  }
  const chart = echarts.init(chartDom);
  const option: echarts.EChartsOption = {
    tooltip: {
      show: true,
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: data.map(item => item.value),
        type: 'line',
      },
    ],
    grid: {
      left: '8%',
      right: '5%',
      top: '8%',
      bottom: '12%',
    },
  };
  chart.setOption(option);
}

const ecologyOverview = ref<EcologyOverview>();
getEcologyOverviewApi(encodeURIComponent(repoName.value)).then(({ data }) => {
  ecologyOverview.value = data;
});

const ecologyActivityCategory = ref<EcologyActivityCategory>();

getEcologyActivityCategoryApi(encodeURIComponent(repoName.value))
  .then(({ data }) => {
    ecologyActivityCategory.value = data;
  })
  .then(() => {
    renderLineChart('#code-submit-frequency-chart', ecologyActivityCategory.value?.commitFrequency);
    renderLineChart(
      '#issue-comment-frequency-chart',
      ecologyActivityCategory.value?.commentFrequency,
    );
    renderLineChart('#update-issue-count-chart', ecologyActivityCategory.value?.updatedIssuesCount);
    renderLineChart('#close-issue-count-chart', ecologyActivityCategory.value?.closedIssuesCount);
    renderLineChart('#organization-count-chart', ecologyActivityCategory.value?.orgCount);
    renderLineChart('#maintainer-count-chart', ecologyActivityCategory.value?.contributorCount);
  });
</script>

<template>
  <div ref="softwareDetailsEl" pb-50px bg-coolgray-50>
    <div overflow-hidden p-20px bg-white shadow-md v-loading="overviewLoading">
      <div w-1280px m-auto>
        <el-image :src="baseInfo.logo" fit="contain" class="float-left w-96px h-96px mr-14px">
          <template #error>
            <div flex flex-justify-center flex-items-center w-full h-full bg-gray-100>
              <el-icon font-size-7 color-gray-400>
                <Picture />
              </el-icon>
            </div>
          </template>
        </el-image>
        <div float-left w-825px>
          <div position-relative flex flex-items-center>
            <el-tooltip effect="light" :teleported="false">
              <div mt--5px mr-12px max-w-600px font-size-7 font-bold line-height-normal class="text-over">
                {{ repoName }}
              </div>

              <template #content>
                <div max-w-900px>{{ repoName }}</div>
              </template>
            </el-tooltip>
            <el-button type="primary" plain :icon="Plus">对比</el-button>
            <el-button type="primary" position-absolute right-0>导出评估报告</el-button>
          </div>
          <el-tooltip effect="light" :teleported="false">
            <div mb-2 font-size-3.5 class="text-over">{{ baseInfo.description }}</div>

            <template #content>
              <div max-w-900px>{{ baseInfo.description }}</div>
            </template>
          </el-tooltip>
          <el-tag v-for="(label, idx) in baseInfo.tags" :key="idx" :type="tagType(idx)" mr-2 mb-2>{{
      label
    }}</el-tag>
        </div>
        <div id="software-radar-chart" float-right w-328px h-303px pt-30px bg-coolgray-50 />
        <el-table :data="baseInfo.tableData" stripe border :show-header="false" show-overflow-tooltip
          tooltip-effect="light">
          <el-table-column prop="label" align="center" />
          <el-table-column prop="value" align="center" :formatter="(row: TableRow) => row.value ?? 'NA'" />
        </el-table>
      </div>
    </div>
    <div w-1280px m-auto>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:function mr-2 />
        <span>功能</span>
      </div>
      <el-card mb-6>
        <div font-size-5 font-bold>Github Star 趋势（演示数据）</div>
        <div id="github-start-chart" h-252px />
      </el-card>
      <el-card mb-6>
        <div font-size-5 font-bold>开发者满意度</div>
        <div id="developer-satisfaction-chart" h-252px />
      </el-card>
      <el-card>
        <div font-size-5 font-bold>文档最佳实践</div>
        <div flex>
          <div id="doc-best-practices-chart" w-280px h-208px flex-none />
          <div flex flex-wrap justify-between content-between h-208px>
            <div v-for="(docItem, idx) in documentInfo.items" :key="idx" w-470px h-95px p-3 bg-coolgray-50>
              <div flex flex-items-center font-bold mb-1>
                <span v-if="docItem.has" i-ph-check-circle mr-1 font-size-5 color-green-300 />
                <span v-else i-ph-minus-circle mr-1 font-size-5 color-gray-400 />
                <span>{{ docItem.title }}</span>
              </div>
              <div font-size-14px color-gray class="text-over-2">{{ docItem.content }}</div>
            </div>
          </div>
        </div>
      </el-card>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:performance mr-2 />
        <span>性能</span>
      </div>
      <el-card>
        <div>包大小</div>
        <div flex flex-items-center h-86px>
          <div mr-200px>
            <div mb-2 font-bold>{{ performanceModuleInfo.size }} B</div>
            <div>MINIFIED</div>
          </div>
          <div mr-200px>
            <div mb-2 font-bold>{{ performanceModuleInfo.gzipSize }} B</div>
            <div>Gzip压缩后</div>
          </div>
        </div>
        <div flex flex-items-center h-30px>
          <span font-bold>Benchmark Score: </span>
          <el-progress :percentage="performanceModuleInfo.benchmarkScore" text-inside :stroke-width="15" flex-auto ml-6
            mr-6 />
          <a href="" color-revert>查看性能Benchmark</a>
        </div>
      </el-card>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:quality mr-2 />
        <span>质量</span>
      </div>
      <el-card mb-6>
        <div mb-4 font-size-5 font-bold>OpenSSF Scorecard</div>
        <div>{{ openSSFScordcard.score }} / 10</div>
        <div v-for="item in openSSFScordcard.items" :key="item.label" flex flex-items-center h-30px>
          <span w-190px>{{ item.label }}</span>
          <el-progress :percentage="item.value * 10"  :stroke-width="10" flex-auto
            :color="scorecardProgressColor(item.value)" >
            <span>{{ item.value }} / 10</span>
            </el-progress>
        </div>
      </el-card>
      <el-card>
        <div mb-4 font-size-5 font-bold>SonarCloud Scan（演示数据）</div>
        <div h-207px flex flex-wrap justify-between content-between>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-bug-beetle-fill font-size-5 mb-3px mr-1 />
              <span>Reliability</span>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{ sonarCloudScan.bug }}</span>
              <span font-light>Bugs</span>
              <span i-ph-question-duotone font-size-5 ml-1 mb-2px></span>
            </div>
            <div
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% bg-blue text-center translate-y--50%">
              <span vertical-middle color-white>{{ sonarCloudScan.reliabilityLevel }}</span>
            </div>
          </div>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-atom-bold font-size-5 mb-3px mr-1 />
              <span>Maintainability</span>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{ sonarCloudScan.codeSmells }}</span>
              <span font-light>Code Smells</span>
              <span i-ph-question-duotone font-size-5 ml-1 mb-2px></span>
            </div>
            <div
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% bg-blue text-center translate-y--50%">
              <span vertical-middle color-white>{{ sonarCloudScan.maintainabilityLevel }}</span>
            </div>
          </div>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-lock-simple-open-fill font-size-5 mb-3px mr-1 />
              <span>Security</span>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{ sonarCloudScan.vulnerabilities }}</span>
              <span font-light>Vulnerabilities</span>
              <span i-ph-question-duotone font-size-5 ml-1 mb-2px></span>
            </div>
            <div
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% bg-blue text-center translate-y--50%">
              <span vertical-middle color-white>{{ sonarCloudScan.securityLevel }}</span>
            </div>
          </div>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-shield-checkered-fill font-size-5 mb-3px mr-1 />
              <span>Security Review</span>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{ sonarCloudScan.securityHotspots }}</span>
              <span font-light mr-1>Security Hotspots</span>
              <span i-ph-question-duotone font-size-5 mr-4 mb-2px></span>
              <span i-ph-circle-bold color-rose-800 mr-1 mb-2px font-size-5 />
              <span font-light>{{ sonarCloudScan.reviewed }} Reviewed</span>
            </div>
            <div
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% bg-blue text-center translate-y--50%">
              <span vertical-middle color-white>{{ sonarCloudScan.securityReviewLevel }}</span>
            </div>
          </div>
        </div>
      </el-card>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:ecology mr-2 />
        <span>生态</span>
      </div>
      <div flex flex-wrap justify-between content-between>
        <el-card w-full mb-6>
          <div mb-4 font-size-5 font-bold>成熟度</div>
          <div flex justify-between flex-items-center ml-8 h-62px>
            <div flex w-210px>
              <div i-custom:download font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ toKilo(ecologyOverview?.downloads) }}</div>
                <div line-height-7>npm 下载量（k）</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:star font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ toKilo(ecologyOverview?.stargazersCount) }}</div>
                <div line-height-7>star数量（k）</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:fork font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ toKilo(ecologyOverview?.forkNum) }}</div>
                <div line-height-7>fork数量（k）</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:bus font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ ecologyOverview?.busFactor }}</div>
                <div line-height-7>巴士系数</div>
              </div>
            </div>
          </div>
          <el-divider />
          <div mb-4 font-size-5 font-bold>影响力</div>
          <div flex justify-between flex-items-center ml-8 mb-4 h-62px>
            <div flex w-210px>
              <div i-custom:medal font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ ecologyOverview?.openRank }}</div>
                <div line-height-7>OpenRank得分</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:trophy font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ ecologyOverview?.criticalityScore }}</div>
                <div line-height-7>Criticality得分</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:contributor font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ ecologyOverview?.contributorCount }}</div>
                <div line-height-7>贡献者数量</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:link font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ ecologyOverview?.dependentCount }}</div>
                <div line-height-7>被依赖数量</div>
              </div>
            </div>
          </div>
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>代码提交频率</div>
          <div id="code-submit-frequency-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>Issue评论频率</div>
          <div id="issue-comment-frequency-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>更新Issue数量</div>
          <div id="update-issue-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>关闭Issue数量</div>
          <div id="close-issue-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>组织数量</div>
          <div id="organization-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>维护者数量</div>
          <div id="maintainer-count-chart" h-200px />
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.text-over {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-over-2 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

:deep(.el-table) {
  float: left;
  margin-top: 14px;
  width: 935px;
  height: 185px;

  .cell {
    line-height: 20px;
  }
}
</style>
