<script setup lang="ts">
import type { RankInfo, TableHeaders } from '@orginjs/oss-evaluation-components-api';
import { RankType, DateType } from '@orginjs/oss-evaluation-components-api';
import { getSoftwareRankApi, DataType } from '@orginjs/oss-evaluation-components-api';

const dataTypeNameMap = {
  [DataType.star]: 'Star',
  [DataType.contributor]: 'Contributor',
  [DataType.ecoScore]: '生态评分',
  [DataType.qualityScore]: '质量评分',
  [DataType.downloadCount]: '下载量',
};
const activeDataType = ref(DataType.star);

const cascaderValue = ref(['语言', 'JavaScript']);
const cascaderOptions = ref([
  {
    value: '语言',
    label: '语言',
    children: [
      {
        value: 'JavaScript',
        label: 'JavaScript',
      },
      {
        value: 'Java',
        label: 'Java',
      },
    ],
  },
]);

const dateTypeNameMap = {
  [DateType.year]: '年',
  [DateType.month]: '月',
  [DateType.week]: '周',
};
const dateType = ref(DateType.month);

const rankTypeNameMap = {
  [RankType.increase]: '增长',
  [RankType.total]: '总量',
};
const rankType = ref(RankType.increase);

const tableRef = ref();
const pageNo = ref(1);
const tableHeaders = ref<TableHeaders>({});
const tableData = ref<RankInfo[]>([]);
const loadingTableData = ref(false);

const loadMoreData = async () => {
  if (loadingTableData.value) return;

  const params = {
    dateType: dateType.value,
    rankType: rankType.value,
    language: cascaderValue.value[cascaderValue.value.length - 1],
    pageNo: pageNo.value++,
    pageSize: 20,
  };

  try {
    loadingTableData.value = true;
    const res = await getSoftwareRankApi(params, activeDataType.value);
    if (res.data.data.data.length > 0) {
      tableData.value.push(...res.data.data.data);
      tableHeaders.value = res.data.data.headers;
    }
  } catch (error) {
    // 请求报错
  } finally {
    loadingTableData.value = false;
  }
};

const getSoftwareRank = () => {
  pageNo.value = 1;
  tableData.value = [];
  loadMoreData();
};
getSoftwareRank();

const handleTableScroll = (event: Event) => {
  const tableElement = event.target as HTMLElement;
  const scrollTop = tableElement.scrollTop;
  const scrollHeight = tableElement.scrollHeight;
  const clientHeight = tableElement.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadMoreData();
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
        ></el-tab-pane>
      </el-tabs>
    </div>

    <div flex justify-between mb-20px>
      <div>
        <el-cascader
          v-model="cascaderValue"
          :options="cascaderOptions"
          :props="{ expandTrigger: 'hover' }"
          :show-all-levels="false"
          @change="getSoftwareRank"
        />
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
      height="calc(100vh - 300px)"
    >
      <el-table-column
        v-for="(value, key) in tableHeaders"
        :key="key"
        :label="value"
        show-overflow-tooltip
      >
        <template v-if="key === 'name'" #default="scope">
          <el-link :underline="false" :href="scope.row.htmlUrl" target="_blank">
            <div flex items-center>
              <el-image
                style="width: 32px; height: 32px; border-radius: 32px"
                :src="scope.row.logo"
                fit="fill"
              ></el-image>
              <span flex-1 ml-10px>{{ scope.row.name }}</span>
            </div></el-link
          >
        </template>
        <template v-else #default="scope">{{ scope.row[key] || '-' }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="less"></style>
