<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import type { CellStyle } from 'element-plus';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type {
  SoftwareInfo,
  SoftwareBaseInfo,
  PerformanceInfo,
  EcologyActivity,
  BenchmarkData,
  AlternativeInfo,
} from '@orginjs/oss-evaluation-components-api';
import {
  getSoftwareInfo,
  getPerformanceModuleInfo,
  getEcologyActivityCategoryApi,
  exportFileApi,
} from '@orginjs/oss-evaluation-components-api';
import { CompareFavorites } from '../compare-favorites';
import {
  getLevelColor,
  getTagType,
  scorecardProgressColor,
} from '@orginjs/oss-evaluation-components-utils';
import {
  toKilo,
  formatFloat,
  formatNumber,
  formatString,
} from '@orginjs/oss-evaluation-components-utils';
import i18n from '../../i18n';

dayjs.extend(relativeTime);
const props = defineProps<{ repoName: string }>();

type TableRow = {
  label: string;
  value: string | number;
};

const encodedRepoName = computed(() => encodeURIComponent(props.repoName));
const project = ref<SoftwareInfo>();
const loadingOverview = ref(false);
const baseInfoTable = ref<TableRow[]>([]);
const tagList = ref<string[]>([]);
const alternatives = ref<AlternativeInfo[]>();
const starTrend = ref<
  Array<{
    date: string;
    stargazers: number;
  }>
>;
const openSSFScorecard = ref<
  Array<{
    label: string;
    value: string | number;
  }>
>([]);
const documentInfo = ref<{
  score: string | number;
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

watchEffect(async () => {
  loadingOverview.value = true;
  const { data } = await getSoftwareInfo(encodedRepoName.value);
  project.value = data;
  tagList.value = data.tags ? data.tags.split('|') : [];
  baseInfoTable.value = [
    {
      label: 'Stars',
      value: `${toKilo(data.star)} `,
    },
    {
      label: 'Fork',
      value: `${toKilo(data.fork)} `,
    },
    {
      label: '官网地址',
      value: data.homePage,
    },
    {
      label: '开发语言',
      value: data.language,
    },
    {
      label: '代码量',
      value: `${(data.codeLines / 1000).toFixed(2)} kl`,
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
  openSSFScorecard.value = [
    {
      label: 'Code-Review',
      value: formatFloat(data.scorecard?.codeReview),
    },
    {
      label: 'Maintained',
      value: formatFloat(data.scorecard?.maintained),
    },
    {
      label: 'CII-Best-Practices',
      value: formatFloat(data.scorecard?.ciiBestPractices),
    },
    {
      label: 'License',
      value: formatFloat(data.scorecard?.license),
    },
    {
      label: 'Security-Policy',
      value: formatFloat(data.scorecard?.securityPolicy),
    },
    {
      label: 'Dangerous-Workflow',
      value: formatFloat(data.scorecard?.dangerousWorkflow),
    },
    {
      label: 'Branch-Protection',
      value: formatFloat(data.scorecard?.branchProtection),
    },
    {
      label: 'Token-Permissions',
      value: formatFloat(data.scorecard?.tokenPermissions),
    },
    {
      label: 'Binary-Artifacts',
      value: formatFloat(data.scorecard?.binaryArtifacts),
    },
    {
      label: 'Fuzzing',
      value: formatFloat(data.scorecard?.fuzzing),
    },
    {
      label: 'SAST',
      value: formatFloat(data.scorecard?.sast),
    },
    {
      label: 'Vulnerabilities',
      value: formatFloat(data.scorecard?.vulnerabilities),
    },
    {
      label: 'Pinned-Dependencies',
      value: formatFloat(data.scorecard?.pinnedDependencies),
    },
  ];
  documentInfo.value = {
    score: formatFloat(data.document?.documentScore),
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
        title: 'Contributing',
        content:
          'A contributing file in your repository provides potential project contributors with a short guide to how they can help with your project.',
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
  await nextTick();
  renderSoftwareRadarChart();
  renderDeveloperSatisfactionChart();
  renderDocBestPracticesChart();
  loadingOverview.value = false;
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
      axisName: {
        fontWeight: 'bold',
        color: '#b3b3b3',
        fontSize: '16',
      },
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
              formatFloat(project.value?.evaluation?.functionScore),
              formatFloat(project.value?.evaluation?.qualityScore),
              formatFloat(project.value?.evaluation?.ecologyScore),
              formatFloat(project.value?.evaluation?.innovationValue),
              formatFloat(project.value?.evaluation?.performanceScore),
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
      data: starTrend.value.date,
      axisLabel: {
        showMaxLabel: true,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        data: starTrend.value.stargazers,
        type: 'line',
        showSymbol: false,
        hoverAnimation: true,
      },
    ],
    grid: {
      left: '1%',
      right: '4%',
      top: '14%',
      bottom: '2%',
      containLabel: true,
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
      axisLabel: {
        showMaxLabel: true,
      },
      axisTick: {
        alignWithLabel: true,
      },
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
      left: '1%',
      right: '4%',
      top: '14%',
      bottom: '2%',
      containLabel: true,
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
            value: formatFloat(documentInfo.value.score) || 0,
          },
        ],
      },
    ],
  };
  chart.setOption(option);
}

const showBenchmarkCompare = ref(true);

// remove unit: `999 ms`
function removeUnit(str: string) {
  return Number(str.split(' ')[0]);
}

const performanceModuleInfo = ref<PerformanceInfo>({
  size: 0,
  gzipSize: 0,
  packageName: '',
  benchmarkScore: 0,
  benchmarkData: { data: [], base: [] },
});

type BenchmarkCompareRow = Record<string, string | null>;
type BenchmarkCompareData = Record<string, BenchmarkCompareRow>;
type MinRowValue = Record<string, number>;

const benchmarkCompareRows = ref<BenchmarkCompareData>({});
const benchmarkCompareColumns = ref<Set<string>>(new Set(['indexName']));
const minRowValue = ref<MinRowValue>({});
const benchmarkCompareTable = computed(() => Object.values(benchmarkCompareRows.value));

watchEffect(async () => {
  const { data } = await getPerformanceModuleInfo(encodedRepoName.value);
  performanceModuleInfo.value = data;
  processBenchmarkData(data.benchmarkData);
});

// Extract table row, min row value and column name from object array data
function processBenchmarkData(benchmarkData?: BenchmarkData, needRetain?: boolean) {
  const rows: BenchmarkCompareData = needRetain ? { ...benchmarkCompareRows.value } : {};
  const columns: Set<string> = needRetain
    ? new Set([...benchmarkCompareColumns.value])
    : new Set(['indexName']);
  const data = benchmarkData?.data || [];
  if (data.length === 0) {
    showBenchmarkCompare.value = false;
  }
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      const indexName = data[i][j].indexName;
      const displayName = data[i][j].displayName;
      const rawValue = data[i][j].rawValue;
      if (indexName && displayName) {
        // get row
        let row = rows[indexName] || { indexName };
        row = { ...row, [displayName]: rawValue };
        rows[indexName] = row;

        // get column
        columns.add(displayName);
      }
    }
  }
  benchmarkCompareRows.value = rows;
  benchmarkCompareColumns.value = columns;

  // get min row value
  const minRowV: MinRowValue = needRetain ? { ...minRowValue.value } : {};
  (benchmarkData?.base || []).forEach(item => (minRowV[item.indexName] = item.bestVal));
  minRowValue.value = minRowV;
}

const computeColor: CellStyle<BenchmarkCompareRow> = function ({ row, column }) {
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
};
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
      axisLabel: {
        showMaxLabel: true,
      },
      axisTick: {
        alignWithLabel: true,
      },
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
      left: '5%',
      right: '5%',
      top: '8%',
      bottom: '2%',
      containLabel: true,
    },
  };
  chart.setOption(option);
}

const loadingEcology = ref(false);
watchEffect(async () => {
  loadingEcology.value = true;
  const { data } = await getEcologyActivityCategoryApi(encodedRepoName.value);
  starTrend.value = data.starTrend;
  alternatives.value = data.alternatives;
  renderLineChart('#week-package-downloads-chart', data.packageDownload);
  renderLineChart('#code-submit-frequency-chart', data.commitFrequency);
  renderLineChart('#issue-comment-frequency-chart', data!.commentFrequency);
  renderLineChart('#update-issue-count-chart', data.updatedIssuesCount);
  renderLineChart('#close-issue-count-chart', data.closedIssuesCount);
  renderLineChart('#organization-count-chart', data.orgCount);
  renderLineChart('#contributor-count-chart', data.contributorCount);
  renderLineChart('#recent-releases-count-chart', data.recentReleasesCount);
  renderGithubStartChart();
  loadingEcology.value = false;
});

async function exportToExcel() {
  try {
    const data = await exportFileApi(encodedRepoName.value);
    saveAs(data, `${props.repoName}.xlsx`);
    ElMessage.success('导出成功');
  } catch (e) {
    ElMessage.error('导出失败');
  }
}

function feedbackAlternative() {
  ElMessage.info('功能建设中，敬请期待');
}

const compareFavoritesRef = ref<InstanceType<typeof CompareFavorites>>();
function addProjectToCompare(info?) {
  if (!info) {
    info = project.value!;
  }
  const { repoName, logo, url, description } = info;
  compareFavoritesRef.value?.addProject([{ repoName, logo, url, description }]);
}

const emits = defineEmits<{
  compareProjects: [projects: Array<SoftwareBaseInfo>];
}>();

const baseInfoDom = ref();
const optionBtnsDom = ref();

function setbOptionBtnsDomPos() {
  if (!optionBtnsDom.value || !baseInfoDom.value) {
    return;
  }
  optionBtnsDom.value.style.left = `${baseInfoDom.value.getBoundingClientRect().left - 160}px`;
}

onMounted(() => {
  nextTick(() => {
    setbOptionBtnsDomPos();
    window.addEventListener('scroll', setbOptionBtnsDomPos);
    window.addEventListener('resize', setbOptionBtnsDomPos);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', setbOptionBtnsDomPos);
  window.removeEventListener('resize', setbOptionBtnsDomPos);
});
</script>

<template>
  <div ref="softwareDetailsEl" class="software-details" bg-coolgray-50>
    <div v-loading="loadingOverview" p-20px bg-white shadow-md>
      <div ref="baseInfoDom" w-1280px m-auto>
        <div ref="optionBtnsDom" class="btn-options-floating">
          <el-button
            type="primary"
            plain
            :icon="Plus"
            class="btn-compare"
            @click="addProjectToCompare"
          >
            对比
          </el-button>
          <el-button type="primary" plain class="btn-export" @click="exportToExcel">
            导出评估报告
          </el-button>
        </div>
        <div class="software-introduction">
          <el-image :src="project?.logo" fit="contain" class="w-96px h-96px mr-14px">
            <template #error>
              <div flex flex-justify-center flex-items-center w-full h-full bg-gray-100>
                <el-icon font-size-7 color-gray-400>
                  <Picture />
                </el-icon>
              </div>
            </template>
          </el-image>
          <div w-1170px mb-8px>
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
              <el-tag
                v-if="project?.techStack !== null && project?.techStack !== undefined"
                mr-3
                size="small"
                type="danger"
                effect="dark"
              >
                {{ project?.techStack }}
              </el-tag>
            </div>
            <div>
              <el-tooltip effect="light" :teleported="false">
                <span mb-2 font-size-3.5 class="text-over">{{ project?.description }}</span>
                <template #content>
                  <div max-w-900px>{{ project?.description }}</div>
                </template>
              </el-tooltip>
            </div>
            <el-tag v-for="(label, idx) in tagList" :key="idx" :type="getTagType(idx)" mr-2 mb-2>{{
              label
            }}</el-tag>
          </div>
        </div>
        <div flex justify-between>
          <el-table
            class="table-base-info"
            :data="baseInfoTable"
            stripe
            border
            :show-header="false"
            tooltip-effect="light"
          >
            <el-table-column prop="label" align="center" />
            <el-table-column
              prop="value"
              align="center"
              :formatter="(row: TableRow) => row.value ?? '-'"
            />
          </el-table>
          <div id="software-radar-chart" w-328px h-280px pt-20px bg-coolgray-50 />
        </div>
      </div>
    </div>
    <div w-1280px m-auto>
      <div flex mt-4 mb-4>
        <div font-size-5 font-bold>相似软件推荐</div>
        <el-tooltip :content="i18n.global.t(`tips.alternatives`)">
          <el-icon size-1 color-gray-400>
            <InfoFilled />
          </el-icon>
        </el-tooltip>
        <el-button round ml-3 :icon="Plus" @click="feedbackAlternative">反馈相似软件</el-button>
      </div>
      <div flex m-4>
        <div v-for="item in alternatives" :key="item.id" flex ml-2>
          <div relative>
            <el-image :src="item.logo" class="alt-logo"></el-image>
            <span v-if="item.ai === 1" i-custom:ai class="badge-icon" />
          </div>
          <div float-left>
            <div max-w-192px class="text-over">
              {{ item.repoName }}
            </div>
            <el-button
              type="primary"
              size="small"
              round
              :icon="Plus"
              @click="addProjectToCompare(item)"
            ></el-button>
          </div>
        </div>
      </div>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:function mr-2 />
        <span>功能</span>
        <span font-size-5 float-right
          >{{ formatFloat(project?.evaluation?.functionScore) }}/100</span
        >
      </div>
      <el-card mb-6>
        <div font-size-5 font-bold>Github Star 趋势</div>
        <div id="github-start-chart" h-252px />
      </el-card>
      <el-card v-if="developerSatisfaction.xAxis.length > 0" mb-6>
        <div flex>
          <div font-size-5 font-bold>开发者满意度</div>
          <el-tooltip :content="i18n.global.t(`tips.satisfaction`)">
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
          <el-tooltip :content="i18n.global.t(`tips.bestPractices`)">
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
                <span v-else i-ph-minus-circle mr-1 font-size-5 color-red-400 />
                <span>{{ docItem.title }}</span>
              </div>
              <el-tooltip :content="docItem.content" placement="top">
                <div font-size-14px color-gray class="text-over-2">
                  {{ docItem.content }}
                </div>
              </el-tooltip>
            </div>
          </div>
        </div>
      </el-card>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span class="i-line-md-speedometer-loop" mr-2 />
        <span>性能</span>
        <span font-size-5 float-right
          >{{ formatFloat(project?.evaluation?.performanceScore) }}/100</span
        >
      </div>
      <el-card>
        <div>
          包大小{{
            performanceModuleInfo.packageName ? ` : ${performanceModuleInfo.packageName}` : ''
          }}
        </div>
        <div flex flex-items-center h-86px>
          <div mr-200px>
            <div mb-2 font-bold>
              {{
                performanceModuleInfo?.size ? (performanceModuleInfo.size / 1024).toFixed(1) : '--'
              }}
              kB
            </div>
            <div>MINIFIED</div>
          </div>
          <div mr-200px>
            <div mb-2 font-bold>
              {{
                performanceModuleInfo?.gzipSize
                  ? (performanceModuleInfo.gzipSize / 1024).toFixed(1)
                  : '--'
              }}
              kB
            </div>
            <div>MINIFIED + GZIPPED</div>
          </div>
        </div>
        <div v-show="showBenchmarkCompare">
          <el-table
            :data="benchmarkCompareTable"
            border
            :max-height="400"
            :cell-style="computeColor"
          >
            <el-table-column v-for="column in benchmarkCompareColumns" :key="column" :prop="column">
              <template #header>
                <div class="flex items-center justify-center">
                  <span>{{ column === 'indexName' ? 'Name' : column }}</span>
                </div>
              </template>
              <template #default="{ row }">
                <div v-if="row[column]" class="flex flex-col items-center justify-center">
                  <span>{{ row[column] }}</span>
                  <span v-if="column !== 'indexName'"
                    >({{ (removeUnit(row[column]) / minRowValue[row.indexName]).toFixed(2) }})</span
                  >
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:quality mr-2 />
        <span>质量</span>
        <span font-size-5 float-right
          >{{ formatFloat(project?.evaluation?.qualityScore) }}/100</span
        >
      </div>
      <el-card mb-6>
        <div flex>
          <div mb-4 font-size-5 font-bold>OpenSSF Scorecard</div>
          <el-tooltip :content="i18n.global.t(`tips.scorecard.scorecard`)">
            <el-icon size-5 color-gray-400>
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </div>
        <div font-bold>{{ formatFloat(project?.scorecard?.score) }} / 10</div>
        <div v-for="item in openSSFScorecard" :key="item.label" flex flex-items-center h-30px>
          <div w-190px>
            <span>{{ item.label }}</span>
            <el-tooltip :content="i18n.global.t(`tips.scorecard.` + item.label)">
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
        <div
          mb-4
          font-size-5
          font-bold
          :class="project?.sonarCloudScan?.sonarProjectKey ? 'color-blue underline' : ''"
        >
          <a
            :href="
              project?.sonarCloudScan?.sonarProjectKey
                ? `https://sonarcloud.io/summary/overall?id=${project.sonarCloudScan.sonarProjectKey}`
                : undefined
            "
            target="_blank"
          >
            SonarCloud
            <span i-material-symbols-file-open />
          </a>
        </div>
        <div h-207px flex flex-wrap justify-between content-between>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-bug-beetle-fill font-size-5 mb-3px mr-1 />
              <el-tooltip
                :content="i18n.global.t(`tips.sonarCloud.reliability`)"
                placement="top-start"
              >
                <span>Reliability</span>
              </el-tooltip>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{
                formatNumber(project?.sonarCloudScan?.bugs)
              }}</span>
              <span font-light>Bugs</span>
              <el-tooltip :content="i18n.global.t(`tips.sonarCloud.bugs`)">
                <el-icon size-5 color-gray-400>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div
              class="position-absolute right-18px top-50% w-48px h-48px border-rd-50% text-center translate-y--50%"
              :style="{
                backgroundColor: getLevelColor(project?.sonarCloudScan?.reliabilityRating),
              }"
            >
              <span vertical-middle color-white font-size-6 line-height-48px>{{
                formatString(project?.sonarCloudScan?.reliabilityRating)
              }}</span>
            </div>
          </div>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-atom-bold font-size-5 mb-3px mr-1 />
              <el-tooltip
                :content="i18n.global.t(`tips.sonarCloud.maintainability`)"
                placement="top-start"
              >
                <span>Maintainability</span>
              </el-tooltip>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{
                formatNumber(project?.sonarCloudScan?.codeSmells)
              }}</span>
              <span font-light>Code Smells</span>
              <el-tooltip :content="i18n.global.t(`tips.sonarCloud.codeSmells`)">
                <el-icon size-5 color-gray-400>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div
              class="position-absolute right-18px top-50% w-48px h-48px border-rd-50% text-center translate-y--50%"
              :style="{
                backgroundColor: getLevelColor(project?.sonarCloudScan?.maintainabilityRating),
              }"
            >
              <span vertical-middle color-white font-size-6 line-height-48px>{{
                formatString(project?.sonarCloudScan?.maintainabilityRating)
              }}</span>
            </div>
          </div>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-lock-simple-open-fill font-size-5 mb-3px mr-1 />
              <el-tooltip
                :content="i18n.global.t(`tips.sonarCloud.security`)"
                placement="top-start"
              >
                <span>Security</span>
              </el-tooltip>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{
                formatNumber(project?.sonarCloudScan?.vulnerabilities)
              }}</span>
              <span font-light>Vulnerabilities</span>
              <el-tooltip :content="i18n.global.t(`tips.sonarCloud.vulnerabilities`)">
                <el-icon size-5 color-gray-400>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div
              class="position-absolute right-18px top-50% w-48px h-48px border-rd-50% text-center translate-y--50%"
              :style="{ backgroundColor: getLevelColor(project?.sonarCloudScan?.securityRating) }"
            >
              <span vertical-middle color-white font-size-6 line-height-48px>{{
                formatString(project?.sonarCloudScan?.securityRating)
              }}</span>
            </div>
          </div>
          <div position-relative pt-3 pd-3 pl-4 pr-4 w-607px h-92px bg-coolgray-50>
            <div mb-4 font-bold>
              <span i-ph-shield-checkered-fill font-size-5 mb-3px mr-1 />
              <el-tooltip
                :content="i18n.global.t(`tips.sonarCloud.securityReview`)"
                placement="top-start"
              >
                <span>Security Review</span>
              </el-tooltip>
            </div>
            <div>
              <span font-bold font-size-6 mr-2>{{
                formatNumber(project?.sonarCloudScan?.securityHotspots)
              }}</span>
              <span font-light mr-1>Security Hotspots</span>
              <el-tooltip :content="i18n.global.t(`tips.sonarCloud.securityHotspots`)">
                <el-icon size-5 color-gray-400>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
            <div
              class="position-absolute right-18px top-50% w-48px h-48px border-rd-50% text-center translate-y--50%"
              :style="{
                backgroundColor: getLevelColor(project?.sonarCloudScan?.securityReviewRating),
              }"
            >
              <span vertical-middle color-white font-size-6 line-height-48px>{{
                formatString(project?.sonarCloudScan?.securityReviewRating)
              }}</span>
            </div>
          </div>
        </div>
      </el-card>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:ecology mr-2 />
        <span>生态</span>
        <span font-size-5 float-right>
          {{ formatFloat(project?.evaluation?.ecologyScore) }}/100
        </span>
      </div>
      <div v-loading="loadingEcology" flex flex-wrap justify-between content-between>
        <el-card w-full mb-6>
          <div mb-4 font-size-5 font-bold>成熟度</div>
          <div flex justify-between flex-items-center ml-8 h-62px>
            <div flex w-210px>
              <div i-custom:created-at font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>
                  {{ dayjs(project?.firstCommit).fromNow() }}
                </div>
                <div line-height-7>创建时间</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:star font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>{{ toKilo(project?.star) }}</div>
                <div line-height-7>Star数量</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:fork font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>{{ toKilo(project?.fork) }}</div>
                <div line-height-7>Fork数量</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:download font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>
                  {{ toKilo(project?.evaluation?.npmDownloads) }}
                </div>
                <div line-height-7>周下载量</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:bus font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>{{ formatFloat(project?.evaluation?.busFactor) }}</div>
                <div flex>
                  <div line-height-7>巴士系数</div>
                  <el-tooltip :content="i18n.global.t(`tips.ecology.busFactor`)">
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
              <div i-custom:trophy font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>
                  {{ formatFloat(project?.evaluation?.criticalityScore) }}
                </div>
                <div flex>
                  <div line-height-7>Criticality得分</div>
                  <el-tooltip :content="i18n.global.t(`tips.ecology.criticality`)">
                    <el-icon size-5 color-gray-400>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:medal font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>{{ formatFloat(project?.evaluation?.openrank) }}</div>
                <div flex>
                  <div line-height-7>OpenRank得分</div>
                  <el-tooltip :content="i18n.global.t(`tips.ecology.openRank`)">
                    <el-icon size-5 color-gray-400>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:contributor font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>
                  {{ toKilo(project?.contributors) }}
                </div>
                <div flex>
                  <div line-height-7>累计贡献者</div>
                  <el-tooltip :content="i18n.global.t(`tips.ecology.totalContributor`)">
                    <el-icon size-5 color-gray-400>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:link font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>{{ toKilo(project?.dependentRepositories) }}</div>
                <div flex>
                  <div line-height-7>被依赖使用</div>
                  <el-tooltip :content="i18n.global.t(`tips.ecology.dependentRepositories`)">
                    <el-icon size-5 color-gray-400>
                      <InfoFilled />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:organization font-size-12 mr-4 />
              <div>
                <div font-bold font-size-5>-</div>
                <div line-height-7>组织使用数量</div>
              </div>
            </div>
          </div>
        </el-card>
        <el-card mb-6 w-626px>
          <div flex>
            <div mb-2 font-size-5 font-bold>包下载量</div>
            <el-tooltip :content="i18n.global.t(`tips.ecology.packageDownloads`)">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div mb-2 font-size-3 text-gray-500>
            {{ i18n.global.t(`tips.ecology.packageDownloads`) }}
          </div>
          <div id="week-package-downloads-chart" h-200px />
        </el-card>

        <el-card mb-6 w-626px>
          <div flex>
            <div mb-2 font-size-5 font-bold>代码提交频率</div>
            <el-tooltip :content="i18n.global.t(`tips.compass`)">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div mb-2 font-size-3 text-gray-500>
            {{ i18n.global.t(`tips.ecology.commitFrequency`) }}
          </div>
          <div id="code-submit-frequency-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div flex>
            <div mb-2 font-size-5 font-bold>组织数量</div>
            <el-tooltip :content="i18n.global.t(`tips.compass`)">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div mb-2 font-size-3 text-gray-500>{{ i18n.global.t(`tips.ecology.orgCount`) }}</div>
          <div id="organization-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div flex>
            <div mb-2 font-size-5 font-bold>Issue评论频率</div>
            <el-tooltip :content="i18n.global.t(`tips.compass`)">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div mb-2 font-size-3 text-gray-500>
            {{ i18n.global.t(`tips.ecology.commentFrequency`) }}
          </div>
          <div id="issue-comment-frequency-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div flex>
            <div mb-2 font-size-5 font-bold>更新Issue数量</div>
            <el-tooltip :content="i18n.global.t(`tips.compass`)">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div mb-2 font-size-3 text-gray-500>
            {{ i18n.global.t(`tips.ecology.updatedIssuesCount`) }}
          </div>
          <div id="update-issue-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div flex>
            <div mb-2 font-size-5 font-bold>关闭Issue数量</div>
            <el-tooltip :content="i18n.global.t(`tips.compass`)">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div mb-2 font-size-3 text-gray-500>
            {{ i18n.global.t(`tips.ecology.closedIssuesCount`) }}
          </div>
          <div id="close-issue-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div flex>
            <div mb-2 font-size-5 font-bold>贡献者数量</div>
            <el-tooltip :content="i18n.global.t(`tips.compass`)">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div mb-2 font-size-3 text-gray-500>
            {{ i18n.global.t(`tips.ecology.contributor`) }}
          </div>
          <div id="contributor-count-chart" h-200px />
        </el-card>
        <el-card mb-6 w-626px>
          <div flex>
            <div mb-2 font-size-5 font-bold>最近发布版本次数</div>
            <el-tooltip :content="i18n.global.t(`tips.compass`)">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div mb-2 font-size-3 text-gray-500>
            {{ i18n.global.t(`tips.ecology.release`) }}
          </div>
          <div id="recent-releases-count-chart" h-200px />
        </el-card>
      </div>
    </div>
  </div>
  <CompareFavorites
    ref="compareFavoritesRef"
    style="position: fixed; bottom: 0px; z-index: 999"
    @compare="(...args) => emits('compareProjects', ...args)"
  ></CompareFavorites>
</template>

<style scoped lang="less">
.software-details {
  min-width: 1680px;
  padding-bottom: 50px;
  .btn-options-floating {
    position: fixed;
    top: 186px;
    z-index: 4;
    display: flex;
    flex-direction: column;
    align-items: center;
    :deep(.el-button) {
      margin: 0 0 16px;
      width: 120px;
    }
  }
  .software-introduction {
    display: flex;
    align-items: flex-start;
  }
  .table-base-info {
    width: 935px;
  }
}
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

.alt-logo {
  border: 2px solid #b6b6b6;
  border-radius: 5px;
  width: 48px;
  height: 48px;
  margin-right: 16px;
}

.badge-icon {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
}
</style>
