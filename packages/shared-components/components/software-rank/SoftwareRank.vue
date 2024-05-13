<script setup lang="ts">
import { getStarsTopApi } from '@orginjs/oss-evaluation-components-api';
import type { rankInfo } from '@orginjs/oss-evaluation-components-api';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';
import { toKilo } from '@orginjs/oss-evaluation-components-utils';
import { throttle } from 'echarts';

const rankPage = ref<{
  pageNo: number;
  pageSize: number;
  data: Array<rankInfo>;
}>({
  pageNo: 0,
  pageSize: 10,
  data: [],
});
const loadingOverview = ref(false);
const softwareRankEl = ref();
const pageSize = ref(10);
const currentPage = ref(1);
const isFirstPage = ref(true);

const activeName = ref('star'); // 初始设定为 'star'
async function switchActiveTrend() {
  loadingOverview.value = true;
  await getTopTrendData(0, pageSize.value, activeName.value);
  currentPage.value = 1;
  isFirstPage.value = true;
  loadingOverview.value = false;
}

async function getTopTrendData(pageNo: number, pageSize: number, type: string) {
  const { data } = await getStarsTopApi({ pageNo, pageSize }, type);
  rankPage.value = data;
  return data;
}

onMounted(async () => {
  loadingOverview.value = true;
  // TODO request parameter
  await getTopTrendData(0, pageSize, 'star');
  // TODO render chart
  nextTick(() => {
    for (let i = 0; i < rankPage.value.data.length; i++) {
      renderGithubTrendChart(i, rankPage.value.data);
    }
  });
  addScrollListener();
  loadingOverview.value = false;
});

function renderGithubTrendChart(index: number, data: Array<rankInfo>) {
  const chartDom = softwareRankEl.value.querySelector(`#github-trend-chart-${index}`);
  if (!chartDom) {
    return;
  }
  const chart = echarts.init(chartDom);
  const option: echarts.EChartsOption = {
    backgroundColor: '#f7f9fb',
    grid: {
      top: '10',
      left: '0',
      right: '0',
      bottom: '0',
    },
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        return params.marker + ': ' + params.value;
      },
    },
    xAxis: {
      type: 'category',
      show: false,
      data: [],
    },
    yAxis: {
      show: false,
      type: 'value',
    },
    legend: {
      data: ['每月新增', '当月总数'],
      bottom: '0',
      left: 'center',
    },
    series: [
      {
        name: '每月新增',
        data: data[index].trend.monthDiff,
        type: 'line',
        lineStyle: {
          color: '#a0d388',
        },
        itemStyle: {
          color: '#a0d388',
        },
        smooth: true,
        showSymbol: false,
        hoverAnimation: true,
      },
      {
        name: '当月总数',
        data: data[index].trend.monthCount,
        type: 'line',
        lineStyle: {
          color: '#4dafff',
        },
        itemStyle: {
          color: '#4dafff',
        },
        smooth: true,
        showSymbol: false,
        hoverAnimation: true,
      },
    ],
  };
  chart.setOption(option);
}

function getRankLevel(index: number) {
  if (index < 3) {
    return ['gold-rank', 'silver-rank', 'copper-rank'][index];
  }
  return 'white-rank';
}

const emit = defineEmits<{
  click: [repoName: string];
}>();

const goSoftwareDetails = (repoName: string) => {
  emit('click', repoName);
};

async function getMore() {
  loadingOverview.value = true;
  let pageNo = rankPage.value.pageNo + 1;
  let pageSize = rankPage.value.pageSize;
  let type = activeName.value;
  if (rankPage.value.data.length >= 100) {
    ElMessage({
      message: 'No more data！',
      type: 'warning',
    });
    loadingOverview.value = false;
    return;
  }
  const { data } = await getStarsTopApi({ pageNo, pageSize }, type);
  if (data.data.length > 0) {
    rankPage.value.data.push(...data.data);
  }
  nextTick(() => {
    for (let i = (pageNo - 1) * pageSize; i < (pageNo - 1) * pageSize + pageSize; i++) {
      renderGithubTrendChart(i, rankPage.value.data);
    }
  });
  rankPage.value.pageNo++;
  isFirstPage.value = false;
  loadingOverview.value = false;
}

let scrollListener;

function addScrollListener() {
  const documentElement = document.documentElement;
  scrollListener = throttle(() => {
    const scrollTop = documentElement.scrollTop;
    const scrollHeight = documentElement.scrollHeight;
    const clientHeight = documentElement.clientHeight;
    if (scrollHeight - scrollTop - clientHeight < 1 && !isFirstPage.value) {
      getMore();
    }
  }, 100);
  document.addEventListener('scroll', scrollListener);
}

onUnmounted(() => {
  document.removeEventListener('scroll', scrollListener);
});
</script>

<template>
  <div
    v-if="rankPage?.data.length"
    ref="softwareRankEl"
    class="software-rank"
    pb-50px
    bg-coolgray-50
  >
    <div flex flex-justify-center bg-white>
      <el-tabs v-model="activeName" h-60px @click="switchActiveTrend">
        <el-tab-pane label="Star Top 100" name="star">
          <template #label>
            <span class="icon" style="font-size: 20px; margin-right: 2px">
              <img
                v-if="activeName === 'star'"
                src="../../assets/svg/star-active.svg"
                alt="Star Icon"
              />
              <img v-else src="../../assets/svg/star.svg" alt="Star Icon" />
            </span>
            <span style="font-weight: bold; font-size: 18px">Star Top 100</span>
          </template>
        </el-tab-pane>

        <el-tab-pane label="Fork Top 100" name="fork">
          <template #label>
            <span class="icon" style="font-size: 24px; margin-right: 2px">
              <img v-if="activeName === 'fork'" src="../../assets/svg/fork-active.svg" />
              <img v-else src="../../assets/svg/fork.svg" />
            </span>
            <span style="font-weight: bold; font-size: 18px">Fork Top 100</span>
          </template>
        </el-tab-pane>

        <el-tab-pane label="Contributors Top 100" name="contributors">
          <template #label>
            <span class="icon" style="font-size: 20px; margin-right: 2px">
              <img
                v-if="activeName === 'contributors'"
                src="../../assets/svg/contributor-active.svg"
              />
              <img v-else src="../../assets/svg/contributor.svg" />
            </span>
            <span style="font-weight: bold; font-size: 18px">Contributors Top 100</span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div v-loading="loadingOverview">
      <div
        v-for="(item, index) in rankPage.data"
        :key="index"
        w-1280px
        overflow-hidden
        bg-white
        shadow-md
        h-142px
        flex
        style="margin-left: auto; margin-right: auto"
      >
        <div
          class="rank-num"
          :class="getRankLevel((currentPage - 1) * pageSize + index)"
          h-43px
          w-35px
          text-center
        >
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </div>
        <div flex flex-content-center grid-items-center ml-20px>
          <el-image
            :src="item.logo"
            fit="contain"
            class="img-border"
            style="cursor: pointer"
            @click="goSoftwareDetails(item.name)"
          >
            <template #error>
              <div flex flex-justify-center flex-items-center w-full h-full bg-gray-100>
                <el-icon font-size-7 color-gray-400>
                  <Picture />
                </el-icon>
              </div>
            </template>
          </el-image>
          <div w-680px style="color: #999999" ml-20px>
            <div
              flex
              flex-items-center
              style="cursor: pointer"
              @click="goSoftwareDetails(item.name)"
            >
              <el-tooltip effect="light" teleported="false">
                <div
                  mt--5px
                  mr-12px
                  max-w-600px
                  font-size-5.2
                  font-bold
                  line-height-normal
                  color-black
                  class="text-over"
                >
                  {{ item.name }}
                </div>
                <template #content>
                  <div max-w-900px>{{ item.name }}</div>
                </template>
              </el-tooltip>
            </div>
            <div flex flex-justify-between w-480px>
              <div flex flex-items-center>
                <a :href="item.htmlUrl" target="_blank">
                  <span class="i-uiw-github" font-size-20px></span>
                </a>
              </div>
            </div>
            <div flex class="max-w-40%">
              <div flex grid-items-center style="width: 33%">
                <span class="icon" style="font-size: 20px; margin-right: 2px">
                  <img src="../../assets/svg/star.svg" alt="Star Icon" />
                </span>
                <span
                  >{{ toKilo(item.starCount)
                  }}<span v-if="toKilo(item.starCount) !== '-'">k</span></span
                >
              </div>
              <div flex grid-items-center style="width: 33%">
                <span class="icon" style="font-size: 24px; margin-right: 2px">
                  <img src="../../assets/svg/fork.svg" alt="Fork Icon" />
                </span>
                <span
                  >{{ toKilo(item.forkCount)
                  }}<span v-if="toKilo(item.forkCount) !== '-'">k</span></span
                >
              </div>
              <div flex grid-items-center style="width: 33%">
                <span class="icon" style="font-size: 20px; margin-right: 2px">
                  <img src="../../assets/svg/contributor.svg" alt="Contributor Icon" />
                </span>
                <span
                  >{{ item.contributors
                  }}<span v-if="item.contributors == null">-</span></span
                >
              </div>
            </div>
          </div>
          <div :id="`github-trend-chart-${index}`" class="trend-chart" />
        </div>
      </div>
      <div v-if="isFirstPage" w-1280px class="get-more">
        <div @click="getMore">
          展示更多
          <el-icon><CaretBottom /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 50%;
  margin: 0 auto;

  .top-header-icon {
    display: flex;
    align-items: center;
    font-weight: bold;
  }

  .active-word {
    background-color: #f5faff;
    color: #44a0ff;
    border-radius: 12px;
  }
}
.icon img {
  width: 20px;
  height: 20px;
}

.img-border {
  border: 0.5px solid #e7e4e4;
  border-radius: 4px;
  box-shadow: 0px 0.5px 0px 0 rgb(201 200 200 / 50%);
  width: 96px;
  height: 96px;
}

.text-over {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-num {
  background-size: contain;
  line-height: 2.3rem;
  color: white;
  font-size: 19px;
  margin-left: 20px;
  margin-top: 40px;
}

.gold-rank {
  background-image: url(../../assets/pic/gold.png);
}

.silver-rank {
  background-image: url(../../assets/pic/sliver.png);
}

.copper-rank {
  background-image: url(../../assets/pic/copper.png);
}

.white-rank {
  background-image: url(../../assets/pic/white.png);
  color: #636363;
}

.trend-chart {
  height: 100px;
  width: 390px;
  border-radius: 12px;
  overflow: hidden;
}
.get-more {
  padding: 20px 0;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
}
</style>
