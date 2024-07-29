<script setup lang="ts">
import { Plus, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import type {
  EChartsOption,
  ECharts,
  CustomSeriesRenderItemParams,
  CustomSeriesRenderItemAPI,
  CustomSeriesRenderItemReturn,
  TooltipComponentOption,
} from 'echarts';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type {
  AlternativeInfo,
  BenchmarkData,
  EcologyActivity,
  PerformanceInfo,
  SoftwareBaseInfo,
  SoftwareInfo,
  StarTrend,
  InnovationData,
  InnovationTableInfo,
  InnovationCompaniesInfo,
  DependentProject,
  CompaniesInfo,
  CompareProject,
} from '@orginjs/oss-evaluation-components-api';
import {
  exportFileApi,
  getEcologyActivityCategoryApi,
  getInnovationApi,
  getPerformanceModuleInfo,
  getSoftwareInfo,
  getGeoDistributionInfo,
} from '@orginjs/oss-evaluation-components-api';
import { CompareFavorites } from '../compare-favorites';
import {
  formatFloat,
  formatNumber,
  formatString,
  getBubbleChartHeightByCount,
  getLevelColor,
  getTagType,
  scorecardProgressColor,
  toKilo,
} from '@orginjs/oss-evaluation-components-utils';
import i18n from '../../i18n';
import * as d3 from 'd3';
import { max } from '@popperjs/core/lib/utils/math';
import worldMap from '../../assets/json/worldMap.json';
import countriesNameMap from '../../assets/json/countriesNameMap.json';
import countriesInfo from '../../assets/json/countriesInfo.json';
import { ApplyAdd } from '../apply-add';
import type { ColumnData, RowData } from '../benchmark-compare/BenchmarkCompareTable.vue';
import BenchmarkCompareTable, { EMPTY_VALUE } from '../benchmark-compare/BenchmarkCompareTable.vue';

dayjs.extend(relativeTime);
const props = defineProps<{ repoName: string }>();

type TableRow = {
  label: string;
  value: string | number;
};

const encodedRepoName = computed(() => encodeURIComponent(props.repoName));
const project = ref<SoftwareInfo>();
const isRequestingProjectInfo = ref(false);
const baseInfoTable = ref<TableRow[]>([]);
const tagList = ref<string[]>([]);
const alternatives = ref<AlternativeInfo[]>([]);
const starTrend = ref<StarTrend>({
  date: [],
  stargazers: [],
});
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
  isRequestingProjectInfo.value = true;
  const { data } = await getSoftwareInfo(encodedRepoName.value);
  project.value = data ?? {};
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
      value: `${data.codeLines ? (data.codeLines / 1000).toFixed(2) : '-'} kl`,
    },
    {
      label: '首次提交',
      value: dayjs(data.firstCommit).format('YYYY-MM-DD'),
    },
    {
      label: '最近代码提交',
      value: dayjs(data.lastCommit).format('YYYY-MM-DD'),
    },
    {
      label: 'License',
      value: data.license,
    },
  ];
  openSSFScorecard.value = [
    {
      label: 'Code-Review',
      value: data.scorecard?.codeReview,
    },
    {
      label: 'Maintained',
      value: data.scorecard?.maintained,
    },
    {
      label: 'CII-Best-Practices',
      value: data.scorecard?.ciiBestPractices,
    },
    {
      label: 'License',
      value: data.scorecard?.license,
    },
    {
      label: 'Security-Policy',
      value: data.scorecard?.securityPolicy,
    },
    {
      label: 'Dangerous-Workflow',
      value: data.scorecard?.dangerousWorkflow,
    },
    {
      label: 'Branch-Protection',
      value: data.scorecard?.branchProtection,
    },
    {
      label: 'Token-Permissions',
      value: data.scorecard?.tokenPermissions,
    },
    {
      label: 'Binary-Artifacts',
      value: data.scorecard?.binaryArtifacts,
    },
    {
      label: 'Fuzzing',
      value: data.scorecard?.fuzzing,
    },
    {
      label: 'SAST',
      value: data.scorecard?.sast,
    },
    {
      label: 'Vulnerabilities',
      value: data.scorecard?.vulnerabilities,
    },
    {
      label: 'Pinned-Dependencies',
      value: data.scorecard?.pinnedDependencies,
    },
  ];
  documentInfo.value = {
    score: data.document?.documentScore ?? 0,
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
      xAxis: (data.satisfaction ?? []).map(item => item.year),
      yAxis: (data.satisfaction ?? []).map(item => item.val),
    };
  }
  await nextTick();
  renderSoftwareRadarChart();
  renderDeveloperSatisfactionChart();
  renderDocBestPracticesChart();
  isRequestingProjectInfo.value = false;
});

const softwareDetailsEl = ref();
function renderSoftwareRadarChart() {
  const chartDom = softwareDetailsEl.value?.querySelector('#software-radar-chart');
  if (!chartDom) {
    return;
  }
  const chart = echarts.init(chartDom);
  const option: EChartsOption = {
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
              formatFloat(project.value?.evaluation?.innovationScore),
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
  const chartDom = softwareDetailsEl.value?.querySelector('#github-start-chart');
  if (!chartDom) {
    return;
  }
  const chart = echarts.init(chartDom);
  const option: EChartsOption = {
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

type SeriesData = Array<{
  depth: number;
  id: string;
  index: number;
  value: number;
  name: string;
}>;

function getDependentSeriesData(data: Array<DependentProject>): SeriesData {
  let count = 1;
  let seriesData = data.map(item => {
    count += 1;
    return {
      depth: 1,
      id: 'option.' + item['ownerName'] + count,
      index: count,
      value: item['star'],
      name: '-' + item['fullName'].split('/')[1],
    };
  });
  seriesData.push({
    depth: 0,
    id: 'option',
    index: 0,
    value: 0,
    name: 'root',
  });
  return seriesData;
}

function getCompaniesSeriesData(data: Array<InnovationCompaniesInfo>): SeriesData {
  let count = 1;
  let seriesData = data.map(item => {
    count += 1;
    return {
      depth: 1,
      id: 'option.' + item['projectId'] + count,
      index: count,
      value: item['creatorsNum'],
      name: '-' + item['orgName'],
    };
  });
  seriesData.push({
    depth: 0,
    id: 'option',
    index: 0,
    value: 0,
    name: 'root',
  });
  return seriesData;
}

function renderBubbleChart(container: string, seriesData: SeriesData) {
  const chartDom = softwareDetailsEl.value?.querySelector(container);
  if (!chartDom) {
    return;
  }
  let myChart = echarts.init(chartDom);
  if (myChart) {
    myChart.dispose();
    myChart = echarts.init(chartDom);
  }

  let displayRoot = stratify();
  function stratify() {
    return d3
      .stratify<any>()
      .parentId(function (d) {
        return d.id.substring(0, d.id.lastIndexOf('.'));
      })(seriesData)
      .sum(function (d) {
        return d.value || 0;
      })
      .sort(function (a, b) {
        return b.value! - a.value!;
      });
  }
  function overallLayout(params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI) {
    let context: any = params.context;
    d3
      .pack()
      .size([api.getWidth() - 2, api.getHeight() - 2])
      .padding(0)(displayRoot);
    context.nodes = {};

    displayRoot.descendants().forEach(function (node) {
      context.nodes[node.id as string] = node;
    });
  }
  function renderItem(
    params: CustomSeriesRenderItemParams,
    api: CustomSeriesRenderItemAPI,
  ): CustomSeriesRenderItemReturn {
    let context: any = params.context;

    // Only do that layout once in each time `setOption` called.
    if (!context.layout) {
      context.layout = true;
      overallLayout(params, api);
    }

    let nodePath = api.value('id');
    let nodeName = (api.value('name') as string).slice(1);
    let node = context.nodes[nodePath];
    if (node.id === 'option') {
      node.r = 0;
    }
    if (!node) {
      // Render nothing.
      return;
    }

    let z2 = (api.value('depth') as number) * 2;
    return {
      type: 'circle',
      shape: {
        cx: node.x,
        cy: node.y,
        r: node.r,
      },
      transition: ['shape'],
      z2: z2,
      textContent: {
        type: 'text',
        style: {
          text: nodeName,
          fill: '#fff',
          fontFamily: 'Arial',
          width: node.r * 1.3,
          overflow: 'truncate',
          fontSize: node.r / 3,
        },
        emphasis: {
          style: {
            overflow: undefined,
            fontSize: Math.max(node.r / 3, 12),
          },
        },
      },
      textConfig: {
        position: 'inside',
      },
      style: {
        fill: '#738ace',
      },
      emphasis: {
        style: {
          fontFamily: 'Arial',
          fontSize: 15,
          shadowBlur: 20,
          shadowOffsetX: 3,
          shadowOffsetY: 5,
          shadowColor: 'rgba(0,0,0,0.3)', // 选中时的阴影强度
        },
      },
    };
  }
  const option: EChartsOption = {
    dataset: {
      source: seriesData,
    },
    tooltip: {
      trigger: 'item',
    },
    hoverLayerThreshold: Infinity,
    series: [
      {
        type: 'custom',
        renderItem: renderItem,
        progressive: 0,
        coordinateSystem: 'none',
        encode: {
          tooltip: ['name', 'value'],
        },
      },
    ],
  };
  if (container === '#dependent-project-bubble-chart') {
    (option.tooltip as TooltipComponentOption).valueFormatter = (obj: any) =>
      obj[0].slice(1) + ' : ' + toKilo(obj[1]) + ' stars';
  }
  if (container === '#project-companies-bubble-chart') {
    (option.tooltip as TooltipComponentOption).valueFormatter = (obj: any) =>
      obj[0].slice(1) + ' ' + obj[1];
  }
  myChart.setOption(option);
}

function renderDeveloperSatisfactionChart() {
  const chartDom = softwareDetailsEl.value?.querySelector('#developer-satisfaction-chart');
  if (!chartDom || !developerSatisfaction.value) {
    return;
  }
  const chart = echarts.init(chartDom);
  const option: EChartsOption = {
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
  const option: EChartsOption = {
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

type CountriesNameMap = Record<string, string>;
const geoActiveTab = ref('star');
const geoDistributionInfo = ref<InnovationData | null>(null);
const geoLoading = ref(false);
let countriesChartInstance: ECharts | null;
echarts.registerMap('world', worldMap as any);

watchEffect(async () => {
  geoActiveTab.value = 'star';
  geoLoading.value = true;
  try {
    const { data } = await getGeoDistributionInfo(encodedRepoName.value);
    geoDistributionInfo.value = data;
    renderCountriesChart('#star-countries-chart', geoDistributionInfo.value?.starCountries ?? []);
  } finally {
    geoLoading.value = false;
  }
});

function renderCountriesChart(selector: string, data: InnovationData['starCountries']) {
  const chartDom = softwareDetailsEl.value?.querySelector(selector);
  if (!chartDom) {
    return;
  }
  const countriesData = data
    .map(country => {
      const countryInfo = countriesInfo.find(item => item.code === country.countryCode);
      if (!countryInfo) {
        return;
      }
      return {
        name: (countriesNameMap as CountriesNameMap)[countryInfo.code] ?? '',
        value: [countryInfo.long, countryInfo.lat, country.creatorsNum, country.percentage],
      };
    })
    .filter(country => country);
  countriesChartInstance?.dispose();
  countriesChartInstance = echarts.init(chartDom);
  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter(data) {
        return `
          <div>${props.repoName}</div>
          <div font-bold>
            <span>${(data as (typeof countriesData)[0])?.name}</span>
            <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <span>${(data as (typeof countriesData)[0])?.value[2]}</span>
          </div>
        `;
      },
    },
    geo: {
      map: 'world',
      roam: false,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      itemStyle: {
        borderColor: 'white',
      },
      emphasis: {
        itemStyle: {
          color: '#86ccf9',
        },
      },
    },
    series: [
      {
        name: props.repoName,
        type: 'scatter',
        coordinateSystem: 'geo',
        data: countriesData.slice(1, 100),
        symbolSize: function (val) {
          return Math.max(Math.sqrt((val[3] * 50000) / Math.PI), 4);
        },
      },
      {
        name: props.repoName,
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: countriesData[0] ? [countriesData[0]] : [],
        symbolSize: function (val) {
          return Math.max(Math.sqrt((val[3] * 50000) / Math.PI), 4);
        },
        label: {
          formatter: '{b}',
          position: 'right',
          show: true,
        },
        itemStyle: {
          shadowBlur: 10,
          shadowColor: '#333',
        },
        zlevel: 1,
      },
    ],
  };
  countriesChartInstance.setOption(option);
}

watch(geoActiveTab, tab => {
  nextTick(() => {
    switch (tab) {
      case 'star':
        renderCountriesChart(
          '#star-countries-chart',
          geoDistributionInfo.value?.starCountries ?? [],
        );
        break;
      case 'issue':
        renderCountriesChart(
          '#issue-countries-chart',
          geoDistributionInfo.value?.issueCountries ?? [],
        );
        break;
      case 'pr':
        renderCountriesChart('#pr-countries-chart', geoDistributionInfo.value?.prCountries ?? []);
        break;
    }
  });
});

const performanceModuleInfo = ref<PerformanceInfo>({
  size: 0,
  gzipSize: 0,
  packageName: '',
  benchmarkScore: 0,
  benchmarkData: { data: [], base: [] },
});

const benchmarkCompareRows = ref<RowData[]>([]);
const benchmarkCompareColumns = ref<ColumnData[]>([]);

watchEffect(async () => {
  const { data } = await getPerformanceModuleInfo(encodedRepoName.value);
  performanceModuleInfo.value = data;
  processBenchmarkData(data.benchmarkData);
});

// Extract table row, min row value and column name from object array data
function processBenchmarkData(benchmarkData?: BenchmarkData) {
  const rowMap: { [k: string]: RowData } = {};
  const columnMap: { [k: string]: ColumnData } = {};

  // get min row value
  const minRowValueMap: { [k: string]: string } = {};
  (benchmarkData?.base || []).forEach(
    item => (minRowValueMap[(item.indexCategory || '') + item.indexName] = String(item.bestVal)),
  );

  const data = benchmarkData?.data || [];
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      const { indexName, displayName, rawValue, indexCategory, unit } = data[i][j];
      if (indexName && displayName) {
        const mapKey = (indexCategory || '') + indexName;
        // get row
        rowMap[mapKey] = {
          ...rowMap[mapKey],
          ...data[i][j],
          benchmarkName: unit ? `${indexName} (${unit})` : indexName,
          category: indexCategory,
          minCellValue: minRowValueMap[mapKey],
          [displayName]:
            Number(rawValue || 0) === 0 // 考虑3种情况：undefined | '' | '0'
              ? EMPTY_VALUE.EMPTY_CELL
              : Number(rawValue).toFixed(3),
        } as RowData;

        // get column
        columnMap[displayName] = {
          projectName: displayName,
          prop: displayName,
        };
      }
    }
  }

  benchmarkCompareRows.value = Object.values(rowMap);
  benchmarkCompareColumns.value = Object.values(columnMap);
}

function renderLineChart(container: string, data: EcologyActivity[]) {
  const chartDom = softwareDetailsEl.value?.querySelector(container);
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

const loadingInnovation = ref(false);
const organizationInfoTable = ref<TableRow[]>([]);
const companiesInfoTable = ref<TableRow[]>([]);
const dependentProjectHeight = ref(100);
const companiesHeight = ref(100);

const companiesBaseInfo = ref<CompaniesInfo>();
watchEffect(async () => {
  const maxProjectNumber = 50;
  const maxOrganizationsNumber = 10;
  loadingInnovation.value = true;
  const innovation = (await getInnovationApi(encodedRepoName.value)).data;
  let { organizationInfo, companiesInfo } = innovation;
  companiesBaseInfo.value = companiesInfo;

  // handle organization info
  let { dependentProject, dependentOrganization } = organizationInfo;
  dependentProject = dependentProject.slice(0, maxProjectNumber);

  // Star Accumulation for the same organizations
  let topArray = Object.values(
    dependentOrganization.reduce(
      (acc: Record<string, InnovationTableInfo>, { ownerName, star }) => {
        acc[ownerName] = acc[ownerName] || { ownerName, star: 0 };
        acc[ownerName].star += star;
        return acc;
      },
      {},
    ),
  );
  // Convert to array
  organizationInfoTable.value = topArray
    .slice(0, maxOrganizationsNumber)
    .map(item => ({ label: item.ownerName, value: item.star }));

  dependentProjectHeight.value = max(
    getBubbleChartHeightByCount(dependentProject.length),
    organizationInfoTable.value.length * 50,
  );
  // handle companies info
  let maxCompaniesSize = max(
    companiesInfo.stargazers.length,
    companiesInfo.prCreators.length,
    companiesInfo.issueCreators.length,
  );
  companiesHeight.value = getBubbleChartHeightByCount(maxCompaniesSize);
  await nextTick(() => {
    renderBubbleChart('#dependent-project-bubble-chart', getDependentSeriesData(dependentProject));
    renderBubbleChart(
      '#project-companies-bubble-chart',
      getCompaniesSeriesData(companiesBaseInfo.value!.stargazers),
    );
    companiesInfoTable.value = companiesInfo.stargazers
      .slice(0, maxOrganizationsNumber)
      .map(item => ({ label: item.orgName, value: item.percentage }));
  });
  loadingInnovation.value = false;
});

const companiesActiveName = ref('star');
function handleCompaniesActiveClick() {
  const maxOrganizationsNumber = 10;
  const { issueCreators, stargazers, prCreators } = companiesBaseInfo.value!;

  if (companiesActiveName.value === 'issue') {
    renderBubbleChart('#project-companies-bubble-chart', getCompaniesSeriesData(issueCreators));
    companiesInfoTable.value = companiesBaseInfo
      .value!.issueCreators.slice(0, maxOrganizationsNumber)
      .map(item => ({ label: item.orgName, value: item.percentage }));
  }
  if (companiesActiveName.value === 'star') {
    renderBubbleChart('#project-companies-bubble-chart', getCompaniesSeriesData(stargazers));
    companiesInfoTable.value = companiesBaseInfo
      .value!.stargazers.slice(0, maxOrganizationsNumber)
      .map(item => ({ label: item.orgName, value: item.percentage }));
  }
  if (companiesActiveName.value === 'pr') {
    renderBubbleChart('#project-companies-bubble-chart', getCompaniesSeriesData(prCreators));
    companiesInfoTable.value = companiesBaseInfo
      .value!.prCreators.slice(0, maxOrganizationsNumber)
      .map(item => ({ label: item.orgName, value: item.percentage }));
  }
}

async function exportToExcel() {
  try {
    const data = await exportFileApi(encodedRepoName.value);
    saveAs(data, `${props.repoName}.xlsx`);
    ElMessage.success('导出成功');
  } catch (e) {
    ElMessage.error('导出失败');
  }
}

function toBenchmarkPage() {
  window.open(location.origin + '/#/benchmark-compare', '_blank');
}

const compareFavoritesRef = ref<InstanceType<typeof CompareFavorites>>();
function addProjectToCompare(info: CompareProject | undefined) {
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
    <div v-loading="isRequestingProjectInfo" p-20px bg-white shadow-md>
      <div ref="baseInfoDom" w-1280px m-auto>
        <div ref="optionBtnsDom" class="btn-options-floating">
          <el-button
            type="primary"
            plain
            :disabled="!project"
            class="btn-compare"
            @click="addProjectToCompare(project)"
            ><span class="add-version-icon"></span>添加对比</el-button
          >
          <el-button type="primary" plain :icon="Download" @click="exportToExcel"
            >导出报告</el-button
          >
          <el-button type="primary" plain class="btn-benchmark" @click="toBenchmarkPage"
            ><span class="benchmark-icon"></span>Benchmark</el-button
          >
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
          <div w-1170px>
            <div flex flex-items-center>
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
              <el-tag v-if="project?.techStack" mr-3 size="small" type="danger" effect="dark">
                {{ project?.techStack }}
              </el-tag>
            </div>
            <el-tooltip effect="light" :teleported="false">
              <div mb-2 font-size-3.5 class="text-over">{{ project?.description }}</div>
              <template #content>
                <div max-w-900px>{{ project?.description }}</div>
              </template>
            </el-tooltip>
            <el-tag v-for="(label, idx) in tagList" :key="idx" :type="getTagType(idx)" mr-2 mb-2>
              {{ label }}
            </el-tag>
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
              :formatter="(row: TableRow) => (row.value ? String(row.value) : '-')"
            />
          </el-table>
          <div id="software-radar-chart" w-328px h-280px pt-20px bg-coolgray-50 />
        </div>
      </div>
    </div>
    <div w-1280px m-auto>
      <div id="alternative" class="flex items-center mt-4 mb-4">
        <div font-size-5 font-bold>相似软件推荐</div>
        <el-tooltip :content="i18n.global.t(`tips.alternatives`)">
          <el-icon class="size-5 color-gray-400">
            <InfoFilled />
          </el-icon>
        </el-tooltip>
        <slot name="application" :project="project">
          <ApplyAdd
            :application-type="2"
            :alternative-project-id="String(project?.id ?? '')"
            success-message="已反馈相似软件"
          >
            <template #trigger>
              <el-button round ml-3 :icon="Plus" size="small"> 反馈相似软件 </el-button>
            </template>
            <template #dialog-header>
              <div font-size-18px>反馈相似软件</div>
            </template>
          </ApplyAdd>
        </slot>
      </div>
      <div flex my-5>
        <div v-for="item in alternatives" :key="item.id" class="alter-item" flex>
          <div flex items-end relative>
            <el-image :src="item.logo" class="alt-logo"></el-image>
            <span v-if="item.ai === 1" i-custom:ai class="badge-icon" />
          </div>
          <div flex flex-col items-start float-left>
            <el-tooltip effect="light" :content="item.repoName" placement="top">
              <div mb-6px w-140px class="text-over">
                <el-link
                  :href="'/#/software-details?repoName=' + item.repoName"
                  target="_blank"
                  :underline="false"
                  :title="item.repoName"
                >
                  {{ item.repoName }}
                </el-link>
              </div>
            </el-tooltip>
            <el-button type="primary" size="small" round @click="addProjectToCompare(item)">
              <span style="color: #ffffff" class="add-version-icon"></span>添加对比
            </el-button>
          </div>
        </div>
        <div v-if="!alternatives.length" class="color-gray">暂无数据</div>
      </div>
      <div id="function" mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:function mr-2 />
        <span>功能</span>
        <span font-size-5 float-right>
          {{ formatFloat(project?.evaluation?.functionScore) }}/100
        </span>
      </div>
      <el-card mb-6>
        <span font-size-5 font-bold>Github Star 趋势</span>
        <el-tooltip :content="i18n.global.t(`tips.githubStarTrend`)">
          <el-icon size-5 color-gray-400>
            <InfoFilled />
          </el-icon>
        </el-tooltip>
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
      <div>
        <div
          id="performance"
          mt-4
          mb-4
          font-size-7
          font-bold
          line-height-normal
          flex
          flex-items-center
          justify-between
        >
          <div flex flex-items-center>
            <span class="i-line-md-speedometer-loop" mr-2 />
            <span mr-4>性能</span>
          </div>
          <span font-size-5>{{ formatFloat(project?.evaluation?.performanceScore) }}/100</span>
        </div>
        <el-card>
          <div v-if="performanceModuleInfo.packageName">
            <div>
              包大小{{
                performanceModuleInfo.packageName ? ` : ${performanceModuleInfo.packageName}` : ''
              }}
            </div>
            <div flex flex-items-center h-86px>
              <div mr-200px>
                <div mb-2 font-bold>
                  {{
                    performanceModuleInfo?.size
                      ? (performanceModuleInfo.size / 1024).toFixed(1)
                      : '--'
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
          </div>
          <BenchmarkCompareTable
            v-if="benchmarkCompareRows.length"
            :rows="benchmarkCompareRows"
            :columns="benchmarkCompareColumns"
          />
          <slot v-else name="benchmark" :project="project">
            <ApplyAdd :application-type="3">
              <template #trigger>
                <span>
                  <span>暂无性能数据，</span>
                  <span class="btn-add-benchmark">点击新增Benchmark</span>
                </span>
              </template>
              <template #dialog-header>
                <div font-size-18px>新增Benchmark</div>
              </template>
            </ApplyAdd>
          </slot>
        </el-card>
      </div>
      <div id="quality" mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:quality mr-2 />
        <span>质量</span>
        <span font-size-5 float-right>
          {{ formatFloat(project?.evaluation?.qualityScore) }}/100
        </span>
      </div>
      <el-card id="scorecard" mb-6>
        <div flex>
          <div mb-4 font-size-5 font-bold>OpenSSF Scorecard</div>
          <el-tooltip :content="i18n.global.t(`tips.scorecard.scorecard`)">
            <el-icon size-5 color-gray-400>
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </div>
        <div font-bold>{{ formatFloat(project?.scorecard?.score) }} / 10</div>
        <template v-for="item in openSSFScorecard" :key="item.label">
          <div v-if="Number(item.value) !== -1" flex flex-items-center h-30px>
            <div w-190px>
              <span>{{ item.label }}</span>
              <el-tooltip :content="i18n.global.t(`tips.scorecard.` + item.label)">
                <el-icon size-5 color-gray-400>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>

            <el-progress
              :percentage="Math.max(Number(item.value ?? 0), 0) * 10"
              :stroke-width="10"
              flex-auto
              :color="scorecardProgressColor(Math.max(Number(item.value ?? 0), 0))"
            >
              <span>{{ formatFloat(item.value) }} / 10</span>
            </el-progress>
          </div>
        </template>
      </el-card>
      <el-card id="sonar-cloud">
        <div mb-4 font-size-5 font-bold>
          <a
            :class="project?.sonarCloudScan?.sonarProjectKey ? 'color-blue underline' : ''"
            :href="
              project?.sonarCloudScan?.sonarProjectKey
                ? `https://sonarcloud.io/summary/overall?id=${project.sonarCloudScan.sonarProjectKey}`
                : undefined
            "
            target="_blank"
          >
            SonarCloud
          </a>
          <el-tooltip :content="i18n.global.t(`tips.sonarCloud.languageSupportTips`)">
            <el-icon size-5 color-gray-400>
              <InfoFilled />
            </el-icon>
          </el-tooltip>
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
      <div id="ecology" mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:ecology mr-2 />
        <span>生态</span>
        <span font-size-5 float-right>
          {{ formatFloat(project?.evaluation?.ecologyScore) }}/100
        </span>
      </div>
      <div
        v-loading="loadingEcology && isRequestingProjectInfo"
        flex
        flex-wrap
        justify-between
        content-between
      >
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
        <el-card w-1280px>
          <div mb-2 font-size-5 font-bold>业界使用情况</div>
          <div font-size-3 text-gray-500 class="custom-divide">
            基于 Github 的依赖关系分析得出使用{{ repoName }}的知名开源项目和组织。
          </div>
          <div flex>
            <div w-922px mr-4 position-relative>
              <div flex position-absolute top-21px style="z-index: 1">
                <div font-size-5 font-bold>知名项目</div>
                <el-tooltip :content="i18n.global.t(`tips.dependentOrganization.project`)">
                  <el-icon size-5 color-gray-400>
                    <InfoFilled />
                  </el-icon>
                </el-tooltip>
              </div>
              <div
                id="dependent-project-bubble-chart"
                :style="{ height: dependentProjectHeight + 'px' }"
              />
            </div>
            <el-card w-300px style="box-shadow: unset">
              <div flex>
                <div font-size-5 font-bold mb-6px>知名组织</div>
                <el-tooltip :content="i18n.global.t(`tips.dependentOrganization.organization`)">
                  <el-icon size-5 color-gray-400>
                    <InfoFilled />
                  </el-icon>
                </el-tooltip>
              </div>
              <template v-if="organizationInfoTable?.length">
                <div
                  v-for="(org, idx) in organizationInfoTable"
                  :key="idx"
                  flex
                  justify-between
                  mt-18px
                >
                  <span class="text-over">{{ org.label }}</span>
                </div>
              </template>
              <div
                v-else-if="!isRequestingProjectInfo"
                :style="{ height: dependentProjectHeight + 'px' }"
                flex
                justify-center
                items-center
                color-gray
              >
                暂无数据
              </div>
            </el-card>
          </div>
        </el-card>
      </div>

      <div id="innovation" mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-ph:lightbulb-filament-bold mr-2 />
        <span>创新</span>
        <span font-size-5 float-right>-/100</span>
      </div>
      <el-card id="creators-area" v-loading="!loadingInnovation && geoLoading" mb-6>
        <div flex>
          <div mb-2 font-size-5 font-bold>贡献者多样性</div>
          <el-tooltip :content="i18n.global.t(`tips.ossInsight`)">
            <el-icon size-5 color-gray-400>
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </div>
        <span font-size-3 text-gray-500>
          {{ i18n.global.t(`tips.geoDistribution`) }}
        </span>
        <el-tabs v-model="geoActiveTab" class="companies-tabs-bold">
          <el-tab-pane label="Stargazers" name="star">
            <div flex>
              <div id="star-countries-chart" w-922px h-500px mr-4 />
              <el-card w-300px style="box-shadow: unset">
                <div mb-6 font-size-5 font-bold>Top 10 地区</div>
                <template v-if="geoDistributionInfo?.starCountries?.length">
                  <div
                    v-for="(country, idx) in geoDistributionInfo.starCountries.slice(0, 10)"
                    :key="idx"
                    flex
                    justify-between
                    mt-18px
                  >
                    <span class="text-over max-w-200px">{{
                      (countriesNameMap as CountriesNameMap)[country.countryCode]
                    }}</span>
                    <span>{{
                      Math.max(Number((Number(country.percentage) * 100).toFixed(1)), 0.1) + '%'
                    }}</span>
                  </div>
                </template>
                <div v-else-if="!geoLoading" h-300px flex justify-center items-center color-gray>
                  暂无数据
                </div>
              </el-card>
            </div>
          </el-tab-pane>
          <el-tab-pane label="Issue Creators" name="issue">
            <div flex>
              <div id="issue-countries-chart" w-922px h-500px mr-4 />
              <el-card w-300px style="box-shadow: unset">
                <div mb-6 font-size-5 font-bold>Top 10 地区</div>
                <template v-if="geoDistributionInfo?.issueCountries?.length">
                  <div
                    v-for="(country, idx) in geoDistributionInfo.issueCountries.slice(0, 10)"
                    :key="idx"
                    flex
                    justify-between
                    mt-18px
                  >
                    <span class="text-over max-w-200px">{{
                      (countriesNameMap as CountriesNameMap)[country.countryCode]
                    }}</span>
                    <span>{{
                      Math.max(Number((Number(country.percentage) * 100).toFixed(1)), 0.1) + '%'
                    }}</span>
                  </div>
                </template>
                <div v-else-if="!geoLoading" flex justify-center items-center color-gray>
                  暂无数据
                </div>
              </el-card>
            </div>
          </el-tab-pane>
          <el-tab-pane label="Pull Request Creators" name="pr">
            <div flex>
              <div id="pr-countries-chart" w-922px h-500px mr-4 />
              <el-card w-300px style="box-shadow: unset">
                <div mb-6 font-size-5 font-bold>Top 10 地区</div>
                <template v-if="geoDistributionInfo?.prCountries?.length">
                  <div
                    v-for="(country, idx) in geoDistributionInfo.prCountries.slice(0, 10)"
                    :key="idx"
                    flex
                    justify-between
                    mt-18px
                  >
                    <span class="text-over max-w-200px">{{
                      (countriesNameMap as CountriesNameMap)[country.countryCode]
                    }}</span>
                    <span>{{
                      Math.max(Number((Number(country.percentage) * 100).toFixed(1)), 0.1) + '%'
                    }}</span>
                  </div>
                </template>
                <div v-else-if="!geoLoading" h-300px flex justify-center items-center color-gray>
                  暂无数据
                </div>
              </el-card>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <div
        v-loading="loadingInnovation"
        flex
        flex-wrap
        justify-between
        content-between
        items-center
      >
        <el-card id="creators-company" mb-6 w-1280px>
          <div flex>
            <div mb-2 font-size-5 font-bold>组织多样性</div>
            <el-tooltip :content="i18n.global.t(`tips.ossInsight`)">
              <el-icon size-5 color-gray-400>
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <span font-size-3 text-gray-500>
            {{ i18n.global.t(`tips.companies.info`) }}
          </span>
          <el-tabs
            v-model="companiesActiveName"
            class="companies-tabs-bold"
            @update:model-value="handleCompaniesActiveClick"
          >
            <el-tab-pane label="Stargazers" name="star"></el-tab-pane>
            <el-tab-pane label="Issue Creators" name="issue"> </el-tab-pane>
            <el-tab-pane label="Pull Requests Creators" name="pr"> </el-tab-pane>
            <div flex>
              <div w-922px mr-4>
                <div
                  id="project-companies-bubble-chart"
                  :style="{ height: companiesHeight + 'px' }"
                />
              </div>
              <el-card w-300px style="box-shadow: unset">
                <div mb-6 font-size-5 font-bold>Top 10 公司</div>
                <template v-if="companiesInfoTable?.length">
                  <div
                    v-for="(companiesItem, idx) in companiesInfoTable"
                    :key="idx"
                    flex
                    justify-between
                    mt-18px
                  >
                    <span class="text-over max-w-200px">{{ companiesItem.label }}</span>
                    <span>{{ companiesItem.value }}</span>
                  </div>
                </template>
                <div
                  v-else-if="!loadingInnovation"
                  :style="{ height: companiesHeight + 'px' }"
                  flex
                  justify-center
                  items-center
                  color-gray
                >
                  暂无数据
                </div>
              </el-card>
            </div>
          </el-tabs>
        </el-card>
      </div>
    </div>
  </div>
  <CompareFavorites
    ref="compareFavoritesRef"
    style="position: fixed; bottom: 0px; z-index: 999"
    @compare="args => emits('compareProjects', args)"
  ></CompareFavorites>
</template>

<style scoped lang="less">
.software-details {
  min-width: 1680px;
  padding-bottom: 50px;
  .btn-options-floating {
    position: fixed;
    top: 193px;
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
    margin-bottom: 8px;
  }
  .table-base-info {
    width: 935px;
    :deep(.cell) {
      line-height: 18px;
    }
  }
  .btn-add-benchmark {
    cursor: pointer;
    color: var(--el-color-primary);
  }
}

.add-version-icon {
  margin-right: 6px;
  display: inline-block;
  mask: url('../../assets/svg/add-versus.svg');
  mask-size: 100% 100%;
  background-color: currentColor;
  color: #409eff;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn-compare {
  &:hover {
    .add-version-icon {
      color: #ffffff;
    }
  }
}

.benchmark-icon {
  margin-right: 6px;
  display: inline-block;
  mask: url('../../assets/svg/benchmark.svg');
  mask-size: 100% 100%;
  background-color: currentColor;
  color: #409eff;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.btn-benchmark {
  &:hover {
    .benchmark-icon {
      color: #ffffff;
    }
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
  border: 1px solid #e4e7ed;
  border-radius: 5px;
  width: 48px;
  height: 48px;
  margin-right: 16px;
}

.badge-icon {
  position: absolute;
  top: -12px;
  right: 0;
  width: 24px;
  height: 24px;
}

.alter-item + .alter-item {
  margin-left: 8px;
}

.companies-tabs-bold {
  :deep(.el-tabs__item) {
    font-weight: bold;
  }
}
.custom-divide {
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.results {
  .col {
    display: inline-flex;
    flex-direction: column;
    border-right: 1px #e6e6e6 solid;

    .benchmark-name {
      width: 130px;
    }
  }

  :deep(.benchmark-value-cell .cell) {
    padding: 0px !important;
    .header-move-btn {
      color: #0000;
      border-color: #0000;
      background-color: #0000;
      position: absolute;
      top: calc(50% - 16px);
      left: calc(50% - 16px);
      &:hover {
        color: var(--el-button-hover-text-color);
        border-color: var(--el-button-hover-border-color);
        background-color: var(--el-button-hover-bg-color);
      }
    }
  }
}
</style>
