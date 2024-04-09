<script setup lang="ts">
import { getStarsTopApi } from '@api/SoftwareRank';
import type { rankInfo } from '@api/SoftwareRank';
import * as echarts from 'echarts';
import { toKilo } from '@utils/number';

const rankPage = ref<{
  pageNo: number;
  pageSize: number;
  data: Array<rankInfo>;
}>({
  pageNo: 0,
  pageSize: 10,
  data: [],
});
const softwareRankEl = ref();
const activeIcon = ref('star');
const pageSize = ref(10);
const currentPage = ref(1);

async function getTopTrendData(pageNo: number, pageSize: number, type: string) {
  const { data } = await getStarsTopApi({ pageNo, pageSize }, type);
  rankPage.value = data;
  return data;
}

onMounted(async () => {
  // TODO request parameter
  await getTopTrendData(0, pageSize, 'star');
  // TODO render chart
  nextTick(() => {
    for (let i = 0; i < 10; i++) {
      renderGithubTrendChart(i);
    }
  });
});

function renderGithubTrendChart(index: number) {
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
        data: [200, 300, 400, 469, 570, 657, 800, 876, 767, 900, 980, 982],
        type: 'line',
        lineStyle: {
          color: '#a0d388',
        },
        itemStyle: {
          color: '#a0d388',
        },
        smooth: true,
      },
      {
        name: '当月总数',
        data: [200, 467, 456, 570, 680, 765, 900, 785, 743, 932, 999, 700],
        type: 'line',
        lineStyle: {
          color: '#4dafff',
        },
        itemStyle: {
          color: '#4dafff',
        },
        smooth: true,
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

async function setActiveIcon(icon: string) {
  activeIcon.value = icon;
  // TODO request parameter
  await getTopTrendData(0, pageSize, icon);
  currentPage.value = 1;
}

function handlePageChange(newPage: number) {
  currentPage.value = newPage;
  getTopTrendData(newPage, pageSize, activeIcon.value);
}

const emit = defineEmits<{
  click: [repoName: string];
}>();

const goSoftwareDetails = (repoName: string) => {
  emit('click', repoName);
};
</script>

<template>
  <div ref="softwareRankEl" class="software-rank" pb-50px bg-coolgray-50>
    <div overflow-hidden p-20px bg-white shadow-md>
      <div w-1280px m-auto>
        <div class="top-header">
          <div
            class="top-header-icon"
            :class="{ 'active-word': activeIcon === 'star' }"
            @click="() => setActiveIcon('star')"
          >
            <span class="i-ic-round-star" style="font-size: 20px; margin-right: 2px"></span>
            <span>Star Top 100</span>
          </div>
          <div
            class="top-header-icon"
            :class="{ 'active-word': activeIcon === 'fork' }"
            @click="() => setActiveIcon('fork')"
          >
            <span class="i-gg-git-fork" style="font-size: 24px"></span>
            <span>Fork Top 100 </span>
          </div>
          <div
            class="top-header-icon"
            :class="{ 'active-word': activeIcon === 'contributors' }"
            @click="() => setActiveIcon('contributors')"
          >
            <span class="i-octicon-people-24" style="font-size: 20px; margin-right: 2px"></span>
            <span>Contributors Top 100</span>
          </div>
        </div>
      </div>
    </div>
    <div style="margin-top: 20px">
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
            float-left
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
            <div flex flex-items-center @click="goSoftwareDetails(item.name)">
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
              <div class="top-header-icon" flex grid-items-center style="width: 33%">
                <span
                  class="i-ph-star"
                  flex-shrink-0
                  style="font-size: 18px; margin-right: 2px"
                ></span>
                <span
                  >{{ toKilo(item.starCount)
                  }}<span v-if="toKilo(item.starCount) !== '-'">k</span></span
                >
              </div>
              <div class="top-header-icon" flex grid-items-center style="width: 33%">
                <span class="i-gg-git-fork" flex-shrink-0 style="font-size: 24px"></span>
                <span
                  >{{ toKilo(item.forkCount)
                  }}<span v-if="toKilo(item.forkCount) !== '-'">k</span></span
                >
              </div>
              <div class="top-header-icon" flex grid-items-center style="width: 33%">
                <span
                  class="i-octicon-people-24"
                  flex-shrink-0
                  style="font-size: 20px; margin-right: 2px"
                ></span>
                <span
                  >{{ toKilo(item.contributorCount)
                  }}<span v-if="toKilo(item.contributorCount) !== '-'">k</span></span
                >
              </div>
            </div>
          </div>
          <div :id="`github-trend-chart-${index}`" class="trend-chart" />
        </div>
      </div>
      <div w-500px style="margin-top: 20px; margin-left: auto; margin-right: auto">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="100"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
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

    .i-ic-round-star,
    .i-gg-git-fork,
    .i-octicon-people-24 {
      color: #feba60;
    }
  }
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
  background-image: url(../assets/pic/gold.png);
}

.silver-rank {
  background-image: url(../assets/pic/sliver.png);
}

.copper-rank {
  background-image: url(../assets/pic/copper.png);
}

.white-rank {
  background-image: url(../assets/pic/white.png);
  color: #636363;
}

.trend-chart {
  height: 100px;
  width: 390px;
  border-radius: 12px;
  overflow: hidden;
}
</style>
