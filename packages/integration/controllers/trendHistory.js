import {
  GithubProjects,
  GithubProjectsHistory,
  EvaluationSummaryHistory,
  TrendHistory,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export async function storeSingleProjectTrendHandler(req, res) {
  const { repoUrl: repoUrl } = req.params;
  const project = await getProjectByUrl(repoUrl);
  await storeTrendHistory(project.id);
  res.status(200).send('success');
}

export async function storeAllProjectTrendHandler(req, res) {
  await storeTrendHistory();
  res.status(200).send('success');
}

const DATA_TYPE = {
  STAR: 1,
  CONTRIBUTOR: 2,
  ECOLOGY: 3,
  QUALITY: 4,
};

const DATE_TYPE = {
  YEAR: 1,
  MONTH: 2,
};

async function getProjectList(projectId) {
  const projectList = await GithubProjects.findAll({
    attributes: ['id'],
    where: projectId
      ? {
          id: projectId,
        }
      : {},
  });
  return projectList;
}

export async function storeTrendHistory(projectId) {
  logger.info('Store Trend History');
  // 1. get all github project
  const projectList = await getProjectList(projectId);
  const sumOfProject = projectList.length;
  logger.info(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    logger.info('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. update project trend
    await storeGithubHistory(project.id);
    await storeEvaluateScore(project.id);
  }
}

/**
 * This method is used for evaluate.js to update evaluate trend history
 *
 * @export
 * @param {*} projectId
 */
export async function storeEvaluateTrendHistory(projectId) {
  logger.info('Store Evaluate Trend History');
  // 1. get all github project
  const projectList = await getProjectList(projectId);
  const sumOfProject = projectList.length;
  logger.info(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    logger.info('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. update project trend
    await storeEvaluateScore(project.id);
  }
}

/**
 * Build a query to capture data from the last two years
 *
 * @param {*} projectId
 * @return {*}
 */
async function getQuery(projectId) {
  const query = {
    where: {
      projectId: projectId,
      date: {
        [Op.between]: [
          dayjs.utc().subtract(1, 'year').startOf('year').$d, //去年1月1日0:00
          dayjs.utc().add(1, 'year').startOf('year').$d, //明年1月1日0:00
        ],
      },
    },
  };
  return query;
}

/**
 * Remove duplicate data by year-month to prevent errors in the calculation of annual increases and totals
 * If multiple data of the same project exist in a month of a year, the earliest data is remained
 *
 * @param {*} dataList
 * @return {*}
 */
async function uniqueYearMonth(dataList) {
  const uniqueData = new Map();
  dataList.sort((a, b) => a.date.localeCompare(b.date));
  dataList.forEach(item => {
    const date = item.date;
    const yearMonth = date.slice(0, 7);

    if (!uniqueData.has(yearMonth)) {
      uniqueData.set(yearMonth, item);
    }
  });

  const result = Array.from(uniqueData.values());
  return result;
}

/**
 * Get data for the current month and the last month
 *
 * @param {*} dataList
 * @return {*}
 */
async function getMonthData(dataList) {
  const currentDate = dayjs();
  const lastDate = currentDate.subtract(1, 'month');
  const currentMonthData = dataList.find(
    item =>
      new Date(item.date).getMonth() === currentDate.month() &&
      new Date(item.date).getFullYear() === currentDate.year(),
  );
  const lastMonthData = dataList.find(
    item =>
      new Date(item.date).getMonth() === lastDate.month() &&
      new Date(item.date).getFullYear() === lastDate.year(),
  );
  return [currentMonthData, lastMonthData];
}

/**
 * Get data for the January of current year and January of last year
 *
 * @param {*} dataList
 * @return {*}
 */
async function getYearData(dataList) {
  const currentYear = dayjs().year();
  const lastYear = currentYear - 1;
  const currentYearData = dataList.find(
    item =>
      new Date(item.date).getMonth() === 0 && new Date(item.date).getFullYear() === currentYear,
  );
  const lastYearData = dataList.find(
    item => new Date(item.date).getMonth() === 0 && new Date(item.date).getFullYear() === lastYear,
  );
  return [currentYearData, lastYearData];
}

/**
 * Calculate the increase and current amount
 *
 * @param {*} dataField
 * @param {*} field
 * @param {*} currentData
 * @param {*} lastData
 */
async function initializeData(dataField, field, currentData, lastData) {
  if (currentData) {
    dataField.current = currentData[field];
  }
  if (lastData) {
    dataField.last = lastData[field];
  }
  if (dataField.current && dataField.last) {
    dataField.increase = dataField.current - dataField.last;
  }
}

/**
 * Get parameters needed to build upsert
 *
 * @param {*} projectId
 * @param {*} data
 * @param {*} dataType
 * @param {*} dateType
 * @return {*}
 */
async function getDumpQuery(projectId, data, dataType, dateType) {
  const currentDate = new Date();
  const insertedData = {
    projectId: projectId,
    date: currentDate,
    dateType: dateType,
    dataType: dataType,
    increasedValue: data.increase,
    totalValue: data.current,
  };
  const condition = {
    where: {
      projectId: projectId,
      date: currentDate,
      dateType: dateType,
      dataType: dataType,
    },
  };
  return [insertedData, condition];
}

async function dumpGithubHistoryMonthTable(projectId, monthData) {
  // 存入月相关数据
  const queryStarMonth = await getDumpQuery(
    projectId,
    monthData.star,
    DATA_TYPE.STAR,
    DATE_TYPE.MONTH,
  );
  const queryContributorMonth = await getDumpQuery(
    projectId,
    monthData.contributor,
    DATA_TYPE.CONTRIBUTOR,
    DATE_TYPE.MONTH,
  );
  await TrendHistory.upsert(queryStarMonth[0], queryStarMonth[1]);
  await TrendHistory.upsert(queryContributorMonth[0], queryContributorMonth[1]);
}

async function dumpGithubHistoryYearTable(projectId, yearData) {
  // 存入年相关数据
  const queryStarYear = await getDumpQuery(
    projectId,
    yearData.star,
    DATA_TYPE.STAR,
    DATE_TYPE.YEAR,
  );
  const queryContributorYear = await getDumpQuery(
    projectId,
    yearData.contributor,
    DATA_TYPE.CONTRIBUTOR,
    DATE_TYPE.YEAR,
  );
  await TrendHistory.upsert(queryStarYear[0], queryStarYear[1]);
  await TrendHistory.upsert(queryContributorYear[0], queryContributorYear[1]);
}

async function dumpEvaluateHistoryTable(projectId, monthData) {
  // 存入月相关数据
  const queryEcologyMonth = await getDumpQuery(
    projectId,
    monthData.ecology,
    DATA_TYPE.ECOLOGY,
    DATE_TYPE.MONTH,
  );
  const queryQualityMonth = await getDumpQuery(
    projectId,
    monthData.quality,
    DATA_TYPE.QUALITY,
    DATE_TYPE.MONTH,
  );
  await TrendHistory.upsert(queryEcologyMonth[0], queryEcologyMonth[1]);
  await TrendHistory.upsert(queryQualityMonth[0], queryQualityMonth[1]);
}

export async function storeGithubHistory(projectId) {
  const query = await getQuery(projectId);
  const githubHistoryRawList = await GithubProjectsHistory.findAll(query);
  const githubHistoryList = await uniqueYearMonth(githubHistoryRawList);
  // 当月和上月数据
  const monthRawData = await getMonthData(githubHistoryList);
  const currentMonthData = monthRawData[0];
  const lastMonthData = monthRawData[1];
  // 当月总量和增长量
  const monthData = {
    star: {
      current: null,
      last: null,
      increase: null,
    },
    contributor: {
      current: null,
      last: null,
      increase: null,
    },
  };
  await initializeData(monthData.star, 'stars', currentMonthData, lastMonthData);
  await initializeData(monthData.contributor, 'contributors', currentMonthData, lastMonthData);
  // 存入数据表
  await dumpGithubHistoryMonthTable(projectId, monthData);

  const currentMonth = dayjs().month();
  // 仅在1月计算年相关数据
  if (currentMonth !== 0) {
    return;
  }
  // 当年和上年数据
  const yearRawData = await getYearData(githubHistoryList);
  const currentYearData = yearRawData[0];
  const lastYearData = yearRawData[1];
  // 当年总量和增长量
  const yearData = {
    star: {
      current: null,
      last: null,
      increase: null,
    },
    contributor: {
      current: null,
      last: null,
      increase: null,
    },
  };
  await initializeData(yearData.star, 'stars', currentYearData, lastYearData);
  await initializeData(yearData.contributor, 'contributors', currentYearData, lastYearData);
  // 存入数据表
  await dumpGithubHistoryYearTable(projectId, yearData);
}

export async function storeEvaluateScore(projectId) {
  const query = await getQuery(projectId);
  const evaluationHistoryRawList = await EvaluationSummaryHistory.findAll(query);
  const evaluationHistoryList = await uniqueYearMonth(evaluationHistoryRawList);
  // 当月和上月数据
  const monthRawData = await getMonthData(evaluationHistoryList);
  const currentMonthData = monthRawData[0];
  const lastMonthData = monthRawData[1];

  // 当月总量和增长量
  const monthData = {
    ecology: {
      current: null,
      last: null,
      increase: null,
    },
    quality: {
      current: null,
      last: null,
      increase: null,
    },
  };
  await initializeData(monthData.ecology, 'ecologyScore', currentMonthData, lastMonthData);
  await initializeData(monthData.quality, 'qualityScore', currentMonthData, lastMonthData);

  // 存入数据表
  await dumpEvaluateHistoryTable(projectId, monthData);
}
