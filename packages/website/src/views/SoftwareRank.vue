<script setup lang="ts">
import { getStarsTopApi } from '../../../shared-components/src/api/SoftwareRank';
import type { rankInfo } from '../../../shared-components/src/api/SoftwareRank';
import * as echarts from 'echarts';

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

async function getTopTrendData(pageNo, pageSize, type) {
  const { data } = await getStarsTopApi({ pageNo, pageSize }, type);
  rankPage.value = data;
  return data;
}

onMounted(async () => {
  // TODO request parameter
  const data = await getTopTrendData(0, 10, 'star');
  console.log(data);
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

function getRankLevel(index) {
  if (index < 3) {
    return ['gold-rank', 'silver-rank', 'copper-rank'][index];
  }
  return 'white-rank';
}

async function setActiveIcon(icon) {
  activeIcon.value = icon;
  console.log(activeIcon);
  // TODO request parameter
  await getTopTrendData(0, 10, icon);
}
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
        <div class="rank-num" :class="getRankLevel(index)" h-43px w-35px text-center>
          {{ index + 1 }}
        </div>
        <div flex flex-content-center grid-items-center ml-20px>
          <el-image
            src="https://avatars.githubusercontent.com/u/6128107?v=4"
            fit="contain"
            class="img-border"
            float-left
            w-96px
            h-96px
          >
            <template #error>
              <div flex flex-justify-center flex-items-center w-full h-full bg-gray-100>
                <el-icon font-size-7 color-gray-400>
                  <Picture />
                </el-icon>
              </div>
            </template>
          </el-image>
          <div float-left w-680px style="color: #c2c2c2" ml-20px>
            <div position-relative flex flex-items-center>
              <el-tooltip effect="light" teleported="false">
                <div
                  mt--5px
                  mr-12px
                  max-w-600px
                  font-size-7
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
              <div flex flex-items-center style="width: 50%">
                <div class="i-mdi-link-variant" flex-shrink-0></div>
                <el-tooltip effect="light" teleported="false">
                  <a href="https://github.com/vuejs/core" class="text-over" target="_blank">{{
                    item.htmlUrl
                  }}</a>
                  <template #content>
                    <div max-w-900px>{{ item.htmlUrl }}</div>
                  </template>
                </el-tooltip>
              </div>
              <div flex flex-items-center style="width: 50%">
                <div class="i-mdi-link-variant" flex-shrink-0></div>
                <el-tooltip effect="light" teleported="false">
                  <a href="https://github.com/vuejs/core" class="text-over" target="_blank">{{
                    item.htmlUrl
                  }}</a>
                  <template #content>
                    <div max-w-900px>{{ item.htmlUrl }}</div>
                  </template>
                </el-tooltip>
              </div>
            </div>

            <div flex flex-justify-between class="max-w-30%">
              <div class="top-header-icon" flex grid-items-center>
                <span class="i-ph-star" style="font-size: 18px; margin-right: 2px"></span>
                <span>{{ item.starCount }}</span>
              </div>
              <div class="top-header-icon" flex grid-items-center>
                <span class="i-gg-git-fork" style="font-size: 24px"></span>
                <span>{{ item.forkCount }}</span>
              </div>
              <div class="top-header-icon" flex grid-items-center>
                <span class="i-octicon-people-24" style="font-size: 20px; margin-right: 2px"></span>
                <span>{{ item.contributorCount }}</span>
              </div>
            </div>
          </div>
          <div :id="`github-trend-chart-${index}`" class="trend-chart" />
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
