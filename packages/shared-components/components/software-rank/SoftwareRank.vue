<script setup lang="ts">
import type { RankInfo, SelectOptions, TableHeaders } from '@orginjs/oss-evaluation-components-api';
import { getLanguageOptionsApi } from '@orginjs/oss-evaluation-components-api';
import { RankType, DateType } from '@orginjs/oss-evaluation-components-api';
import { getSoftwareRankApi, DataType } from '@orginjs/oss-evaluation-components-api';
import { formatFloat, toKilo } from '@orginjs/oss-evaluation-components-utils';

const route = useRoute();
const router = useRouter();

const dataTypeNameMap = {
  [DataType.star]: 'Stars',
  [DataType.contributor]: 'Contributors',
  [DataType.ecoScore]: '生态评分',
  [DataType.qualityScore]: '质量评分',
  [DataType.downloadCount]: '下载量',
};
const activeDataType = ref(DataType.star);

const languages = ref<SelectOptions[]>([]);
const languageOptions = ref<SelectOptions[]>([]);
getLanguageOptionsApi()
  .then(res => {
    languageOptions.value = res.data;
  })
  .catch(() => {
    // 暂无语言数据
  });

const dateTypeNameMap = {
  [DateType.year]: '年',
  [DateType.month]: '月',
  [DateType.week]: '周',
};
const dateType = ref(route.query.dateType || DateType.week);

const rankTypeNameMap = {
  [RankType.increase]: '增长',
  [RankType.total]: '总量',
};
const rankType = ref(route.query.rankType || RankType.increase);

const tableRef = ref();
const pageNo = ref(1);
const tableHeaders = ref<TableHeaders>({});
const tableData = ref<RankInfo[]>([]);
const loadingTableData = ref(false);
const tableColConfig: {
  [k in keyof RankInfo]?: {
    width?: number;
    showOverflowTooltip?: boolean;
  };
} = {
  currentRank: {
    width: 143,
  },
  programmingLanguage: {
    width: 160,
  },
  name: {
    width: 240,
  },
  createdAt: {
    width: 120,
  },
  increasedValue: {
    width: 100,
    showOverflowTooltip: false,
  },
  totalValue: {
    width: 100,
    showOverflowTooltip: false,
  },
};

let canceller: () => void;
const loadMoreData = () => {
  if (loadingTableData.value) return canceller;
  let isAborted = false;

  loadingTableData.value = true;
  const params = {
    dateType: dateType.value,
    rankType: rankType.value,
    language: JSON.stringify(languages.value),
    pageNo: pageNo.value++,
    pageSize: 99,
  };
  getSoftwareRankApi(params, activeDataType.value)
    .then(res => {
      if (!isAborted) {
        tableData.value.push(...res.data.data.data);
        tableHeaders.value = res.data.data.headers;
      }
    })
    .catch(() => {
      // 请求报错
    })
    .finally(() => {
      if (!isAborted) {
        loadingTableData.value = false;
      }
    });

  return () => {
    isAborted = true;
  };
};

const getSoftwareRank = () => {
  pageNo.value = 1;
  tableData.value = [];
  loadingTableData.value = false;
  if (canceller) {
    canceller();
  }
  canceller = loadMoreData();
};
getSoftwareRank();

const handleTableScroll = (event: Event) => {
  const tableElement = event.target as HTMLElement;
  const scrollTop = tableElement.scrollTop;
  const scrollHeight = tableElement.scrollHeight;
  const clientHeight = tableElement.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 50) {
    canceller = loadMoreData();
  }
};

onMounted(() => {
  if (tableRef.value) {
    tableRef.value.scrollBarRef.wrapRef.addEventListener('scroll', handleTableScroll);
  }
});
onUnmounted(() => {
  if (tableRef.value) {
    tableRef.value.scrollBarRef.wrapRef.removeEventListener('scroll', handleTableScroll);
  }
});

watch([dateType, rankType], ([newDateType, newRankType]) => {
  router.push({ query: { ...route.query, dateType: newDateType, rankType: newRankType } });
});
</script>

<template>
  <div w-1280px m-x-auto pb-20px>
    <div flex justify-center>
      <el-tabs v-model="activeDataType" @tab-change="getSoftwareRank">
        <el-tab-pane
          v-for="item in DataType"
          :key="item"
          :label="dataTypeNameMap[item]"
          :name="item"
          :disabled="
            [DataType.ecoScore, DataType.qualityScore, DataType.downloadCount].includes(item)
          "
        ></el-tab-pane>
      </el-tabs>
    </div>

    <div flex justify-between mb-20px>
      <div>
        <div flex items-center>
          <span>编程语言：</span>
          <el-select
            v-model="languages"
            style="width: 180px"
            multiple
            collapse-tags
            clearable
            :placeholder="'请选择编程语言'"
            @change="getSoftwareRank"
          >
            <el-option
              v-for="item in languageOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </div>
      </div>

      <div flex items-center>
        <el-radio-group v-model="dateType" size="small" @change="getSoftwareRank">
          <el-radio-button v-for="item in DateType" :key="item" :value="item">{{
            dateTypeNameMap[item]
          }}</el-radio-button>
        </el-radio-group>
        <el-radio-group v-model="rankType" ml-20px size="small" @change="getSoftwareRank">
          <el-radio-button v-for="item in RankType" :key="item" :value="item">{{
            rankTypeNameMap[item]
          }}</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-table
      ref="tableRef"
      v-loading="loadingTableData"
      element-loading-text="加载中..."
      :data="tableData"
      border
      stripe
      height="calc(100vh - 313px)"
    >
      <el-table-column
        v-for="(value, key) in tableHeaders"
        :key="key"
        :label="value"
        :width="tableColConfig[key]?.width"
        :show-overflow-tooltip="tableColConfig[key]?.showOverflowTooltip ?? true"
      >
        <template v-if="key === 'currentRank'" #default="scope">
          <div flex items-center>
            <span font-size-16px>{{ scope.row.currentRank }}</span>
            <div
              v-if="
                scope.row.previousRank && Math.abs(scope.row.previousRank - scope.row.currentRank)
              "
              ml-4px
              flex
              items-center
              :class="
                scope.row.previousRank - scope.row.currentRank > 0 ? 'color-green' : 'color-red'
              "
            >
              <el-icon
                ><Top v-if="scope.row.previousRank - scope.row.currentRank > 0" /><Bottom v-else
              /></el-icon>
              <span>{{ Math.abs(scope.row.previousRank - scope.row.currentRank) }}</span>
            </div>
          </div>
        </template>
        <template v-else-if="key === 'name'" #default="scope">
          <el-link
            :underline="false"
            :href="`/#/software-details?repoName=${scope.row.name}`"
            target="_blank"
          >
            <div flex items-center>
              <el-image
                style="width: 32px; height: 32px; border-radius: 32px"
                :src="scope.row.logo"
                fit="fill"
                loading="lazy"
              ></el-image>
              <span flex-1 ml-10px overflow-hidden max-w-173px>{{ scope.row.name }}</span>
            </div></el-link
          >
        </template>
        <template v-else-if="key === 'increasedValue' || key === 'totalValue'" #default="scope">
          <el-tooltip v-if="scope.row[key]" :content="String(scope.row[key])">
            <span text-nowrap overflow-hidden text-ellipsis>{{
              toKilo(formatFloat(scope.row[key]))
            }}</span>
          </el-tooltip>
          <span v-else>-</span>
        </template>
        <template v-else #default="scope">{{ scope.row[key] || '-' }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="less">
.el-tabs {
  --el-tabs-header-height: 50px;
}
</style>
