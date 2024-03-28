<script setup lang="ts">
import { CompareFavorites } from '@orginjs/oss-evaluation-components';
import { Plus } from '@element-plus/icons-vue';
import type { CellStyle } from 'element-plus';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import type {
  SoftwareInfo,
  BenchmarkData,
  EcologyActivity,
  EcologyActivityCategory,
  PerformanceModuleInfo,
} from '@api/SoftwareDetails';
import {
  getSoftwareInfo,
  getPerformanceModuleInfo,
  getEcologyActivityCategoryApi,
  exportFileApi,
} from '@api/SoftwareDetails';
import { getLevelColor, getTagType, scorecardProgressColor } from '@utils/color';
import { toKilo, formatFloat, formatNumber, formatString } from '@api/utils';
import { saveAs } from 'file-saver';
import { SearchSoftware } from '@orginjs/oss-evaluation-components';

const compareFavoritesRef = ref<InstanceType<typeof CompareFavorites>>();

const route = useRoute();
const router = useRouter();

const repoName = computed(() => String(route.query.repoName ?? ''));
const encodedRepoName = computed(() => encodeURIComponent(repoName.value));

watch(
  () => repoName.value,
  () => {
    location.reload();
  },
);

type TableRow = {
  label: string;
  value: string | number;
};

const project = ref<SoftwareInfo>();
const overviewLoading = ref(true);
const baseInfoTable = ref<TableRow[]>([]);
const tagList = ref<string[]>([]);
const openSSFScordcard = ref<
  Array<{
    label: string;
    tips: string;
    value: number;
  }>
>([]);
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
const developerSatisfaction = ref({
  xAxis: [] as Array<number>,
  yAxis: [] as Array<number>,
});

getSoftwareInfo(encodedRepoName.value)
  .then(({ data }) => {
    project.value = data;
    tagList.value = data.tags ? data.tags.split('|') : [];
    // basic info
    baseInfoTable.value = [
      {
        label: 'Stars',
        value: `${toKilo(data.star)} k`,
      },
      {
        label: 'Fork',
        value: `${toKilo(data.fork)} k`,
      },
      {
        label: '开发语言',
        value: data.language,
      },
      {
        label: '代码量',
        value: `${toKilo(data.codeLines)} kl`,
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

    openSSFScordcard.value = [
      {
        label: 'Code-Review',
        tips: 'Determines if the project requires human code review before pull requests (aka merge requests) are merged.',
        value: data.scorecard?.codeReview,
      },
      {
        label: 'Maintained',
        tips: 'Determines if the project is "actively maintained".',
        value: data.scorecard?.maintained,
      },
      {
        label: 'CII-Best-Practices',
        tips: 'Determines if the project has an OpenSSF (formerly CII) Best Practices Badge.',
        value: data.scorecard?.ciiBestPractices,
      },
      {
        label: 'License',
        tips: 'Determines if the project has defined a license.',
        value: data.scorecard?.license,
      },
      {
        label: 'Security-Policy',
        tips: 'Determines if the project has published a security policy.',
        value: data.scorecard?.securityPolicy,
      },
      {
        label: 'Dangerous-Workflow',
        tips: "Determines if the project's GitHub Action workflows avoid dangerous patterns.",
        value: data.scorecard?.dangerousWorkflow,
      },
      {
        label: 'Branch-Protection',
        tips: "Determines if the default and release branches are protected with GitHub's branch protection settings.",
        value: data.scorecard?.branchProtection,
      },
      {
        label: 'Token-Permissions',
        tips: "Determines if the project's workflows follow the principle of least privilege.",
        value: data.scorecard?.tokenPermissions,
      },
      {
        label: 'Binary-Artifacts',
        tips: 'Determines if the project has generated executable (binary) artifacts in the source repository.',
        value: data.scorecard?.binaryArtifacts,
      },
      {
        label: 'Fuzzing',
        tips: 'Determines if the project uses fuzzing.',
        value: data.scorecard?.fuzzing,
      },
      {
        label: 'SAST',
        tips: 'Determines if the project uses static code analysis.',
        value: data.scorecard?.sast,
      },
      {
        label: 'Vulnerabilities',
        tips: 'Determines if the project has open, known unfixed vulnerabilities.',
        value: data.scorecard?.vulnerabilities,
      },
      {
        label: 'Pinned-Dependencies',
        tips: 'Determines if the project has declared and pinned the dependencies of its build process.',
        value: data.scorecard?.pinnedDependencies,
      },
    ];

    documentInfo.value = {
      score: data.document.documentScore,
      items: [
        {
          title: 'Readme',
          content:
            'The readme file introduces and explains a project. It contains information that is commonly required to understand what the project is about.',
          has: data.document?.hasReadme,
        },
        {
          title: 'Website',
          content: 'A url that users can visit to learn more about your project.',
          has: data.document?.hasWebsite,
        },
        {
          title: 'Changelog',
          content: 'A curated, chronologically ordered list of notable changes for each version.',
          has: data.document?.hasChangelog,
        },
        {
          title: 'Governance',
          content:
            'Document that explains how the governance and committer process works in the repository.',
          has: data.document?.hasContributing,
        },
      ],
    };
    if (data.satisfaction) {
      developerSatisfaction.value = {
        xAxis: data.satisfaction.map(item => item.year),
        yAxis: data.satisfaction.map(item => item.val),
      };
    }
  })
  .then(() => {
    renderSoftwareRadarChart();
    renderGithubStartChart();
    renderDeveloperSatisfactionChart();
    renderDocBestPracticesChart();
  })
  .finally(() => {
    overviewLoading.value = false;
  });

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
        { name: '生态', max: 100 },
        { name: '创新', max: 100 },
        { name: '性能', max: 100 },
      ],
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [
              project.value?.evaluation.functionScore,
              project.value?.evaluation.qualityScore,
              project.value?.evaluation.ecologyScore,
              project.value?.evaluation.innovationValue,
              project.value?.evaluation.performanceScore,
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
  if (!chartDom || !developerSatisfaction.value) {
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

const showBenchmarkCompare = ref(true);

const performanceModuleInfo = ref<PerformanceModuleInfo>({
  size: 0,
  gzipSize: 0,
  packageName: '',
  benchmarkScore: 0,
  benchmarkData: { data: [], base: [] },
});

getPerformanceModuleInfo(encodedRepoName.value).then(({ data }) => {
  performanceModuleInfo.value = data;
  processBenchmarkData(data.benchmarkData);
});

// remove unit: `999 ms`
function removeUnit(str: string) {
  return Number(str.split(' ')[0]);
}

type BenchmarkCompareRow = Record<string, string | null>;
type BenchmarkCompareData = Record<string, BenchmarkCompareRow>;
type MinRowValue = Record<string, number>;
const benchmarkCompareRows = ref<BenchmarkCompareData>({});
const benchmarkCompareColumns = ref<Set<string>>(new Set(['indexName']));
const benchmarkCompareTable = computed(() => Object.values(benchmarkCompareRows.value));
const minRowValue = ref<MinRowValue>({});

// Extract table row, min row value and column name from object array data
function processBenchmarkData(benchmark: BenchmarkData) {
  const rows: BenchmarkCompareData = { ...benchmarkCompareRows.value };
  const minRowV: MinRowValue = { ...minRowValue.value };
  const columns: Set<string> = new Set([...benchmarkCompareColumns.value]);
  const benchmarkData = benchmark?.data;
  for (let i = 0; i < benchmarkData.length; i++) {
    for (let j = 0; j < benchmarkData[i].length; j++) {
      const indexName = benchmarkData[i][j].indexName;
      const displayName = benchmarkData[i][j].displayName;
      const rawValue = benchmarkData[i][j].rawValue;
      if (indexName && displayName) {
        // get row
        let row = rows[indexName] || { indexName };
        row = { ...row, [displayName]: rawValue };
        rows[indexName] = row;

        // get min row value
        if (rawValue && rawValue.includes(' ')) {
          const num = removeUnit(rawValue);
          const min = minRowV[indexName] || Infinity;
          minRowV[indexName] = Math.min(min, num);
        }

        // get column
        columns.add(displayName);
      }
    }
  }
  benchmarkCompareRows.value = rows;
  minRowValue.value = minRowV;
  benchmarkCompareColumns.value = columns;
}

async function addBenchmarkCompare(name: string) {
  const {
    data: { benchmarkData },
  } = await getPerformanceModuleInfo(encodeURIComponent(name));
  processBenchmarkData(benchmarkData);
}

function computeColor({ row, column }): CellStyle<BenchmarkCompareRow> {
  const cellVal = row[column.property];
  if (column.property === 'indexName' || !cellVal) {
    return {};
  }
  const min = minRowValue.value[row.indexName!];
  const factor = removeUnit(cellVal) / min;
  if (factor < 2.0) {
    const a = factor - 1.0;
    const r = (1.0 - a) * 99 + a * 255;
    const g = (1.0 - a) * 191 + a * 236;
    const b = (1.0 - a) * 124 + a * 132;
    return { backgroundColor: `rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)})` };
  } else {
    const a = Math.min((factor - 2.0) / 2.0, 1.0);
    const r = (1.0 - a) * 255 + a * 249;
    const g = (1.0 - a) * 236 + a * 105;
    const b = (1.0 - a) * 132 + a * 108;
    return { backgroundColor: `rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)})` };
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
      data: data?.map(item => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: data?.map(item => item.value),
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

const ecologyActivityCategory = ref<EcologyActivityCategory>();

getEcologyActivityCategoryApi(encodedRepoName.value)
  .then(({ data }) => {
    ecologyActivityCategory.value = data;
  })
  .then(() => {
    renderLineChart('#code-submit-frequency-chart', ecologyActivityCategory.value!.commitFrequency);
    renderLineChart(
      '#issue-comment-frequency-chart',
      ecologyActivityCategory.value!.commentFrequency,
    );
    renderLineChart('#update-issue-count-chart', ecologyActivityCategory.value!.updatedIssuesCount);
    renderLineChart('#close-issue-count-chart', ecologyActivityCategory.value!.closedIssuesCount);
    renderLineChart('#organization-count-chart', ecologyActivityCategory.value!.orgCount);
    renderLineChart('#maintainer-count-chart', ecologyActivityCategory.value!.contributorCount);
  });

async function exportToExcel() {
  try {
    const data = await exportFileApi(encodedRepoName.value);
    saveAs(data, `${repoName.value}` + `_${dayjs().format()}` + `.xlsx`);
    ElMessage.success('导出成功');
  } catch (e) {
    ElMessage.error('导出失败');
  }
}

function addProjectToCompare() {
  const { logo, url, description } = project;
  compareFavoritesRef.value?.addProject([{ repoName, logo, url, description }]);
}

function compareProjects(
  projects: Array<{ repoName: string; logo: string; url: string; description: string }>,
) {
  router.push({
    path: 'compare-projects',
    query: { repos: projects.map(project => project.repoName) },
  });
}
</script>

<template>
  <div ref="softwareDetailsEl" pb-50px bg-coolgray-50>
    <div v-loading="overviewLoading" overflow-hidden p-20px bg-white shadow-md>
      <div w-1280px m-auto>
        <el-image :src="project?.logo" fit="contain" class="float-left w-96px h-96px mr-14px">
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
              <div
                mt--5px
                mr-12px
                max-w-600px
                font-size-7
                font-bold
                line-height-normal
                class="text-over"
              >
                <a :href="project?.url" target="_blank" rel="noreferrer">
                  {{ repoName }}
                </a>
              </div>

              <template #content>
                <div max-w-900px>{{ repoName }}</div>
              </template>
            </el-tooltip>
            <el-button type="primary" plain :icon="Plus" @click="addProjectToCompare"
              >对比</el-button
            >
            <el-button type="primary" position-absolute right-0 @click="exportToExcel"
              >导出评估报告</el-button
            >
          </div>
          <el-tooltip effect="light" :teleported="false">
            <div mb-2 font-size-3.5 class="text-over">{{ project?.description }}</div>
            <template #content>
              <div max-w-900px>{{ project?.description }}</div>
            </template>
          </el-tooltip>
          <el-tag mr-2 mb-2>{{ project?.techStack }}</el-tag>
          <el-tag v-for="(label, idx) in tagList" :key="idx" :type="getTagType(idx)" mr-2 mb-2>{{
            label
          }}</el-tag>
        </div>
        <div id="software-radar-chart" float-right w-328px h-303px pt-30px bg-coolgray-50 />
        <el-table
          class="base-info"
          :data="baseInfoTable"
          stripe
          border
          :show-header="false"
          show-overflow-tooltip
          tooltip-effect="light"
        >
          <el-table-column prop="label" align="center" />
          <el-table-column
            prop="value"
            align="center"
            :formatter="(row: TableRow) => row.value ?? 'NA'"
          />
        </el-table>
      </div>
    </div>
    <div w-1280px m-auto>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:function mr-2 />
        <span>功能</span>
        <span font-size-5 float-right>{{ formatFloat(project?.evaluation?.functionScore) }}/100</span>
      </div>
      <el-card mb-6>
        <div font-size-5 font-bold>Github Star 趋势（演示数据）</div>
        <div id="github-start-chart" h-252px />
      </el-card>
      <el-card v-if="developerSatisfaction.xAxis.length > 0" mb-6>
        <div flex>
          <div font-size-5 font-bold>开发者满意度</div>
          <el-tooltip
            content="数据来源于历年StateOfJS生态调查报告，更多结果可以查看 https://stateofjs.com/en-US"
          >
            <el-icon size-5 color-gray-400>
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </div>
        <div id="developer-satisfaction-chart" h-252px />
      </el-card>
      <el-card>
        <div flex>
          <div font-size-5 font-bold>文档最佳实践</div>
          <el-tooltip
            content="最佳实践评分基于Linux Foundation建议的Best Practices检查，每个检查项都有不同的权重"
          >
            <el-icon size-5 color-gray-400>
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </div>
        <div flex>
          <div id="doc-best-practices-chart" w-280px h-208px flex-none />
          <div flex flex-wrap justify-between content-between h-208px>
            <div
              v-for="(docItem, idx) in documentInfo.items"
              :key="idx"
              w-470px
              h-95px
              p-3
              bg-coolgray-50
            >
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
        <span i-custom:profession mr-2 />
        <span font-size-5 float-right>{{ formatFloat(project?.evaluation?.performanceScore) }}/100</span>
      </div>
      <el-card>
        <div>
          包大小{{
            performanceModuleInfo.packageName ? ` : ${performanceModuleInfo.packageName}` : ''
          }}
        </div>
        <div flex flex-items-center h-86px>
          <div mr-200px>
            <div mb-2 font-bold>{{ (performanceModuleInfo.size / 1024).toFixed(1) }} kB</div>
            <div>MINIFIED</div>
          </div>
          <div mr-200px>
            <div mb-2 font-bold>{{ (performanceModuleInfo.gzipSize / 1024).toFixed(1) }} kB</div>
            <div>MINIFIED + GZIPPED</div>
          </div>
        </div>
        <div flex flex-items-center h-30px>
          <span font-bold>Benchmark Score: </span>
          <el-progress
            :percentage="performanceModuleInfo.benchmarkScore"
            text-inside
            :stroke-width="15"
            flex-auto
            ml-6
            mr-6
          />
          <el-link
            :underline="false"
            type="primary"
            @click="showBenchmarkCompare = !showBenchmarkCompare"
          >
            {{ showBenchmarkCompare ? '隐藏' : '显示' }}性能Benchmark
          </el-link>
        </div>
        <div v-show="showBenchmarkCompare">
          <SearchSoftware :tech-stack="project?.techStack" @search-name="addBenchmarkCompare">
            <button
              class="search-btn flex flex-items-center p-12px rd-8px h-40px bg-#f6f6f7 b-1 b-solid b-transparent color-black-75 hover:b-#3451b2 mt-10px mb-10px"
            >
              <span class="flex flex-items-center">
                <span i-ph-magnifying-glass-bold />
                <span class="ml-6px">添加软件对比</span>
              </span>
            </button>
          </SearchSoftware>
          <el-table
            :data="benchmarkCompareTable"
            border
            :max-height="400"
            :cell-style="computeColor"
          >
            <el-table-column v-for="column in benchmarkCompareColumns" :key="column" :prop="column">
              <template #header>
                <div class="inline-flex flex-items-center">
                  <span>{{ column === 'indexName' ? 'Name' : column }}</span>
                  <el-icon
                    v-show="column !== 'indexName'"
                    size="16"
                    class="ml-6px cursor-pointer hover-color-#F56C6C"
                    @click="benchmarkCompareColumns.delete(column)"
                  >
                    <Delete />
                  </el-icon>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:quality mr-2 />
        <span>质量</span>
        <span font-size-5 float-right>{{ formatFloat(project?.evaluation?.qualityScore) }}/100</span>
      </div>
      <el-card mb-6>
        <div flex>
          <div mb-4 font-size-5 font-bold>OpenSSF Scorecard</div>
          <el-tooltip
            content="OpenSSF开源安全基金会是一个跨行业合作组织，旨在提高开源软件的安全性。Scorecard为开源项目提供安全健康指标。"
          >
            <el-icon size-5 color-gray-400>
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </div>
        <div font-bold>{{ formatFloat(project?.scorecard?.score) }} / 10</div>
        <div v-for="item in openSSFScordcard" :key="item.label" flex flex-items-center h-30px>
          <div w-190px>
            <span>{{ item.label }}</span>
            <el-tooltip :content="item.tips">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>

          <el-progress
            :percentage="item.value * 10"
            :stroke-width="10"
            flex-auto
            :color="scorecardProgressColor(item.value)"
          >
            <span>{{ item.value }} / 10</span>
          </el-progress>
        </div>
      </el-card>
      <el-card>
        <div mb-4 font-size-5 font-bold>SonarCloud Scan</div>
        <div h-207px flex flex-wrap justify-between content-between>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-bug-beetle-fill font-size-5 mb-3px mr-1 />
              <span>Reliability</span>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{ formatNumber(project?.sonarCloudScan?.bugs) }}</span>
              <span font-light>Bugs</span>
              <el-tooltip content="编码错误会破坏您的代码并且需要立即修复。">
                <el-icon size-5 color-gray-400>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% text-center translate-y--50%"
              :style="{
                backgroundColor: getLevelColor(project?.sonarCloudScan?.reliabilityRating),
              }"
            >
              <span vertical-middle color-white>{{
                formatString(project?.sonarCloudScan?.reliabilityRating)
              }}</span>
            </div>
          </div>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-atom-bold font-size-5 mb-3px mr-1 />
              <span>Maintainability</span>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{
                formatNumber(project?.sonarCloudScan?.codeSmells)
              }}</span>
              <span font-light>Code Smells</span>
              <el-tooltip content="代码混乱且难以维护。">
                <el-icon size-5 color-gray-400>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% text-center translate-y--50%"
              :style="{
                backgroundColor: getLevelColor(project?.sonarCloudScan?.maintainabilityRating),
              }"
            >
              <span vertical-middle color-white>{{
                formatString(project?.sonarCloudScan?.maintainabilityRating)
              }}</span>
            </div>
          </div>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-lock-simple-open-fill font-size-5 mb-3px mr-1 />
              <span>Security</span>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{
                formatNumber(project?.sonarCloudScan?.vulnerabilities)
              }}</span>
              <span font-light>Vulnerabilities</span>
              <el-tooltip content="可以被黑客利用的代码。">
                <el-icon size-5 color-gray-400>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% text-center translate-y--50%"
              :style="{ backgroundColor: getLevelColor(project?.sonarCloudScan?.securityRating) }"
            >
              <span vertical-middle color-white>{{
                formatString(project?.sonarCloudScan?.securityRating)
              }}</span>
            </div>
          </div>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-shield-checkered-fill font-size-5 mb-3px mr-1 />
              <span>Security Review</span>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{
                formatNumber(project?.sonarCloudScan?.securityHotspots)
              }}</span>
              <span font-light mr-1>Security Hotspots</span>
              <el-tooltip content="需要手动检查以评估是否存在漏洞的安全敏感代码。">
                <el-icon size-5 color-gray-400>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% text-center translate-y--50%"
              :style="{
                backgroundColor: getLevelColor(project?.sonarCloudScan?.securityReviewRating),
              }"
            >
              <span vertical-middle color-white>{{
                formatString(project?.sonarCloudScan?.securityReviewRating)
              }}</span>
            </div>
          </div>
        </div>
      </el-card>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:ecology mr-2 />
        <span>生态</span>
        <span font-size-5 float-right>{{ formatFloat(project?.evaluation?.ecologyScore) }}/100</span>
      </div>
      <div flex flex-wrap justify-between content-between>
        <el-card w-full mb-6>
          <div mb-4 font-size-5 font-bold>成熟度</div>
          <div flex justify-between flex-items-center ml-8 h-62px>
            <div flex w-210px>
              <div i-custom:download font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ toKilo(project?.ecologyOverview?.downloads).split('.')[0] }} k</div>
                <div line-height-7>npm周下载量</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:star font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>
                  {{ toKilo(project?.ecologyOverview?.stargazersCount) }} k
                </div>
                <div line-height-7>Star数量</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:fork font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ toKilo(project?.ecologyOverview?.forksCount) }} k</div>
                <div line-height-7>Fork数量</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:bus font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ project?.ecologyOverview?.busFactor }}</div>
                <div flex>
                  <div line-height-7>巴士系数</div>
                  <el-tooltip
                    content="一个项目失去多少贡献者参与（“被巴士撞了”）即导致项目停滞的成员数量"
                  >
                    <el-icon size-5 color-gray-400>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </div>
          <el-divider />
          <div mb-4 font-size-5 font-bold>影响力</div>
          <div flex justify-between flex-items-center ml-8 mb-4 h-62px>
            <div flex w-210px>
              <div i-custom:medal font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ project?.ecologyOverview?.openRank }}</div>
                <div flex>
                  <div line-height-7>OpenRank得分</div>
                  <el-tooltip content="X-lab提出的一种基于全域开发者协作网络的项目影响力评估方法">
                    <el-icon size-5 color-gray-400>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:trophy font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ project?.ecologyOverview?.criticalityScore }}</div>
                <div flex>
                  <div line-height-7>Criticality得分</div>
                  <el-tooltip
                    content="OpenSSF提供的开源项目关键度得分，定义了项目的影响力和重要性。它是一个介于0(最不关键)和1(最关键)之间的数字"
                  >
                    <el-icon size-5 color-gray-400>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:contributor font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ project?.ecologyOverview?.contributorCount }}</div>
                <div line-height-7>贡献者数量</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:link font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ project?.ecologyOverview?.dependentCount }}</div>
                <div line-height-7>被依赖数量</div>
              </div>
            </div>
          </div>
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>代码提交频率</div>
          <div mb-2 font-size-3>过去90天内平均每周代码提交次数。</div>
          <div id="code-submit-frequency-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>Issue评论频率</div>
          <div mb-2 font-size-3>
            过去90天内新建 Issue 的评论平均数（不包含机器人和 Issue 作者本人评论）。
          </div>
          <div id="issue-comment-frequency-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>更新Issue数量</div>
          <div mb-2 font-size-3>过去90天 Issue 更新的数量。</div>
          <div id="update-issue-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>关闭Issue数量</div>
          <div mb-2 font-size-3>过去90天 Issue 更新的数量。</div>
          <div id="close-issue-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>组织数量</div>
          <div mb-2 font-size-3>过去90天内活跃的代码提交者所属组织的数目。</div>
          <div id="organization-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div mb-4 font-size-5 font-bold>维护者数量</div>
          <div id="maintainer-count-chart" h-200px />
        </el-card>
      </div>
    </div>
  </div>
  <CompareFavorites
    ref="compareFavoritesRef"
    style="position: fixed; bottom: 0px; z-index: 999"
    @compare="compareProjects"
  ></CompareFavorites>
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

:deep(.el-table.base-info) {
  float: left;
  margin-top: 8px;
  width: 935px;
  height: 185px;

  .cell {
    line-height: 14px;
  }
}

:deep(.search-btn) {
  width: 280px;
}
</style>
