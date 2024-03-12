<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const baseInfo = ref({
  logoUrl: 'https://v2.vuejs.org/images/logo.svg',
  name: 'vuejs/vue ',
  introduction:
    'Vue.js is a progressive,incrementally-adoptable JavaScript framework for building UI on the web.',
  labels: ['vue', 'UI Framework'],
  tableData: [
    {
      label: 'Stars',
      value: '444225',
    },
    {
      label: '开发语言',
      value: 'TypeScript',
    },
    {
      label: '代码量',
      value: '75K',
    },
    {
      label: '首次提交',
      value: '7年前',
    },
    {
      label: 'License',
      value: 'MIT',
    },
  ],
})

function tagType(idx: number) {
  const remainder = idx % 4
  switch (remainder) {
    case 0:
      return 'primary'
    case 1:
      return 'success'
    case 2:
      return 'warning'
    case 3:
      return 'danger'
  }
}

const softwareDetailsEl = ref()

function renderSoftwareRadarChart() {
  const chartDom = softwareDetailsEl.value?.querySelector('#software-radar-chart')
  if (!chartDom) {
    return
  }
  const chart = echarts.init(chartDom)
  const option: echarts.EChartsOption = {
    radar: {
      indicator: [
        { name: '功能', max: 6500 },
        { name: '质量', max: 16000 },
        { name: '性能', max: 30000 },
        { name: '生态', max: 38000 },
        { name: '创新', max: 52000 },
      ],
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [5000, 14000, 28000, 26000, 42000],
          },
        ],
      },
    ],
  }
  chart.setOption(option)
}
onMounted(renderSoftwareRadarChart)

function renderGithubStartChart() {
  const chartDom = softwareDetailsEl.value.querySelector('#github-start-chart')
  if (!chartDom) {
    return
  }
  const chart = echarts.init(chartDom)
  const option: echarts.EChartsOption = {
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
  }
  chart.setOption(option)
}
onMounted(renderGithubStartChart)

function renderDeveloperSatisfactionChart() {
  const chartDom = softwareDetailsEl.value?.querySelector('#developer-satisfaction-chart')
  if (!chartDom) {
    return
  }
  const chart = echarts.init(chartDom)
  const option: echarts.EChartsOption = {
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
  }
  chart.setOption(option)
}
onMounted(renderDeveloperSatisfactionChart)

function renderDocBestPracticesChart() {
  const chartDom = softwareDetailsEl.value?.querySelector('#doc-best-practices-chart')
  if (!chartDom) {
    return
  }
  const chart = echarts.init(chartDom)
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
            value: 44,
          },
        ],
      },
    ],
  }
  chart.setOption(option)
}
onMounted(renderDocBestPracticesChart)

const docItems = ref([
  {
    title: 'Changelog',
    content:
      'The npm package reactives a total of 22910623 downloads a week.As such,we scored react popularity level to be Key ecosystem project.',
  },
  {
    title: 'Governance',
    content:
      'The npm package reactives a total of 22910623 downloads a week.As such,we scored react popularity level to be Key ecosystem project.',
  },
  {
    title: 'Readme',
    content:
      'The npm package reactives a total of 22910623 downloads a week.As such,we scored react popularity level to be Key ecosystem project.',
  },
  {
    title: 'Website',
    content:
      'The npm package reactives a total of 22910623 downloads a week.As such,we scored react popularity level to be Key ecosystem project.',
  },
])

const performance = ref({
  minified: '110.6kB',
  compress: '40kB',
  benchmarkScore: 89,
})

const openSSFScordcard = ref({
  Maintained: 56,
  'Code-Review': 12,
  'CII-Best-Practices': 30,
  license: 46,
  'Branch-Protection': 88,
})

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
})

const maturity = ref({
  npmDownloadNum: 83.38,
  starNum: 83.38,
  forkNum: 200,
  busFactor: 200,
})

const influence = ref({
  openRankScore: 83.38,
  criticalityScore: 83.38,
  contributorsNum: 200,
  dependentNum: 200,
})

function renderLineChart(container: string) {
  const chartDom = softwareDetailsEl.value.querySelector(container)
  if (!chartDom) {
    return
  }
  const chart = echarts.init(chartDom)
  const option: echarts.EChartsOption = {
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
      left: '6%',
      right: '5%',
      top: '8%',
      bottom: '12%',
    },
  }
  chart.setOption(option)
}
onMounted(() => {
  renderLineChart('#code-submit-frequency-chart')
  renderLineChart('#issue-comment-frequency-chart')
  renderLineChart('#update-issue-count-chart')
  renderLineChart('#close-issue-count-chart')
  renderLineChart('#organization-count-chart')
  renderLineChart('#maintainer-count-chart')
})
</script>

<template>
  <div ref="softwareDetailsEl" pb-50px bg-coolgray-50>
    <div overflow-hidden p-20px bg-white shadow-md>
      <div w-1280px m-auto>
        <el-image :src="baseInfo.logoUrl" fit="contain" class="float-left w-96px h-96px mr-14px" />
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
                {{ baseInfo.name }}
              </div>
              <template #content>
                <div max-w-900px>{{ baseInfo.name }}</div>
              </template>
            </el-tooltip>
            <el-button type="primary" plain :icon="Plus">对比</el-button>
            <el-button type="primary" position-absolute right-0>导出评估报告</el-button>
          </div>
          <el-tooltip effect="light" :teleported="false">
            <div mb-2 font-size-3.5 class="text-over">{{ baseInfo.introduction }}</div>
            <template #content>
              <div max-w-900px>{{ baseInfo.introduction }}</div>
            </template>
          </el-tooltip>
          <el-tag
            v-for="(label, idx) in baseInfo.labels"
            :key="idx"
            :type="tagType(idx)"
            mr-2
            mb-2
            >{{ label }}</el-tag
          >
        </div>
        <div id="software-radar-chart" float-right w-328px h-303px pt-30px bg-coolgray-50 />
        <el-table
          :data="baseInfo.tableData"
          stripe
          border
          :show-header="false"
          show-overflow-tooltip
          tooltip-effect="light"
        >
          <el-table-column prop="label" align="center" />
          <el-table-column prop="value" align="center" />
        </el-table>
      </div>
    </div>
    <div w-1280px m-auto>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:function mr-2 />
        <span>功能</span>
      </div>
      <el-card mb-6>
        <div font-size-5 font-bold>Github Star 趋势</div>
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
            <div v-for="(docItem, idx) in docItems" :key="idx" w-470px h-95px p-3 bg-coolgray-50>
              <div flex flex-items-center font-bold mb-1>
                <span i-ph-check-circle-light mr-1 font-size-5 color-green-300 />
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
            <div mb-2 font-bold>{{ performance.minified }}</div>
            <div>MINIFIED</div>
          </div>
          <div mr-200px>
            <div mb-2 font-bold>{{ performance.compress }}</div>
            <div>Gzip压缩后</div>
          </div>
        </div>
        <div flex flex-items-center h-30px>
          <span font-bold>Benchmark Score: </span>
          <el-progress
            :percentage="performance.benchmarkScore"
            text-inside
            :stroke-width="15"
            flex-auto
            ml-6
            mr-6
          />
          <a href="" color-revert>查看性能Benchmark</a>
        </div>
      </el-card>
      <div mt-4 mb-4 font-size-7 font-bold line-height-normal>
        <span i-custom:quality mr-2 />
        <span>质量</span>
      </div>
      <el-card mb-6>
        <div mb-4 font-size-5 font-bold>OpenSSF scorecard</div>
        <div>5.4/10</div>
        <div v-for="(value, key) in openSSFScordcard" :key="key" flex flex-items-center h-50px>
          <span w-190px>{{ key }}</span>
          <el-progress :percentage="value" text-inside :stroke-width="15" flex-auto />
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
              <span font-bold font-size-6 mr-2>{{ sonarCloudScan.bug }}</span>
              <span font-light>Bugs</span>
              <span i-ph-question-duotone font-size-5 ml-1 mb-2px></span>
            </div>
            <div
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% bg-blue text-center translate-y--50%"
            >
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
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% bg-blue text-center translate-y--50%"
            >
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
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% bg-blue text-center translate-y--50%"
            >
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
              class="position-absolute right-18px top-50% w-30px h-30px border-rd-50% bg-blue text-center translate-y--50%"
            >
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
                <div font-bold font-size-5>{{ maturity.npmDownloadNum }}</div>
                <div line-height-7>npm 下载量（k）</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:star font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ maturity.npmDownloadNum }}</div>
                <div line-height-7>star数量（k）</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:fork font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ maturity.forkNum }}</div>
                <div line-height-7>fork数量（k）</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:bus font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ maturity.busFactor }}</div>
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
                <div font-bold font-size-5>{{ influence.openRankScore }}</div>
                <div line-height-7>OpenRank得分</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:trophy font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ influence.criticalityScore }}</div>
                <div line-height-7>Criticality得分</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:contributor font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ influence.contributorsNum }}</div>
                <div line-height-7>贡献者数量</div>
              </div>
            </div>
            <div flex w-210px>
              <div i-custom:link font-size-14 mr-4 />
              <div>
                <div font-bold font-size-5>{{ influence.dependentNum }}</div>
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
