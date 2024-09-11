import {
  GithubProjects,
  EvaluationSummaryHistory,
  TrendHistory,
  logger,
  GithubProjectsHistory,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import {
  firstDayOfPreviousMonth,
  firstDayOfPreviousYear,
  mondayOfPreviousWeek,
  isFirstDayOfMonth,
  isFirstDayOfWeek,
  isFirstDayOfYear,
} from '../../util/day-js-util.js';

dayjs.extend(utc);

export async function storeSingleProjectTrendHandler(req, res) {
  const { repoUrl: repoUrl, date: dateStr } = req.params;
  const project = await getProjectByUrl(repoUrl);
  await storeTrendHistory(project.id, dayjs(dateStr));
  res.status(200).send('success');
}

export async function storeAllProjectTrendHandler(req, res) {
  await storeTrendHistory(null, dayjs(req.params.date));
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
  WEEK: 3,
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

export async function storeTrendHistory(projectId, date) {
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
    await storeGithubHistory(project.id, date);
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

/**
 * Get the current date and previous date based on the type of date provided.
 * The function checks if the given date is the first day of the week, month, or year,
 * and returns an array of objects containing the current date, previous date, and date type.
 *
 * @param {Date} date - The date to check.
 * @returns {Array<Object>} - An array of objects, each containing:
 *   - {Date} currentDate - The provided date.
 *   - {Date} previousDate - The calculated previous date based on the type.
 *   - {number} dateType - The type of date (WEEK, MONTH, or YEAR).
 */
function getCalculateDateAndType(date) {
  const res = [];
  if (isFirstDayOfWeek(date)) {
    res.push({
      currentDate: date,
      previousDate: mondayOfPreviousWeek(date),
      dateType: DATE_TYPE.WEEK,
    });
  }
  if (isFirstDayOfMonth(date)) {
    res.push({
      currentDate: date,
      previousDate: firstDayOfPreviousMonth(date),
      dateType: DATE_TYPE.MONTH,
    });
  }
  if (isFirstDayOfYear(date)) {
    res.push({
      currentDate: date,
      previousDate: firstDayOfPreviousYear(date),
      dateType: DATE_TYPE.YEAR,
    });
  }
  return res;
}

/**
 * Stores the GitHub history for a given project and date.
 * It calculates the current and previous dates based on the provided date,
 * retrieves the GitHub information for those dates, and then upserts
 * the trend data into the TrendHistory table.
 *
 * @param {number} projectId - The ID of the project for which to store the history.
 * @param {dayjs.Date} date - The date for which to calculate the GitHub history.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function storeGithubHistory(projectId, date) {
  const dateInfos = getCalculateDateAndType(date);
  const propertyTypes = [
    { dataType: DATA_TYPE.STAR, name: 'stars' },
    { dataType: DATA_TYPE.CONTRIBUTOR, name: 'contributors' },
  ];
  for (const dateInfo of dateInfos) {
    const currentGithubInfo = await GithubProjectsHistory.findOne({
      where: {
        date: dateInfo.currentDate.toDate(),
        projectId,
      },
    });
    const previousGithubInfo = await GithubProjectsHistory.findOne({
      where: {
        date: dateInfo.previousDate.toDate(),
        projectId,
      },
    });
    for (const property of propertyTypes) {
      const updateData = {
        projectId,
        date: date.toDate(),
        dateType: dateInfo.dateType,
        dataType: property.dataType,
        // any null then increment is null
        increasedValue:
          currentGithubInfo?.[property.name] == null || previousGithubInfo?.[property.name] == null
            ? null
            : currentGithubInfo[property.name] - previousGithubInfo[property.name],
        totalValue: currentGithubInfo?.[property.name],
      };
      await TrendHistory.upsert(updateData);
    }
  }
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
