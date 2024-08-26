import {
  GithubProjects,
  GithubProjectsHistory,
  EvaluationSummaryHistory,
  TrendHistory,
  sequelize,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import { Op } from 'sequelize';

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

async function getQuery(projectId, currentYear) {
  const query = {
    where: {
      projectId: projectId,
      date: {
        [Op.or]: [
          {
            [Op.and]: [
              { [Op.gte]: new Date(Date.UTC(currentYear - 1, 0, 1, 0)) }, // 去年的1月1日0:00
              { [Op.lte]: new Date(Date.UTC(currentYear, 0, 1, 0)) }, // 今年的1月1日0:00
            ],
          },
          {
            [Op.and]: [
              { [Op.gte]: new Date(Date.UTC(currentYear, 0, 1, 0)) }, // 今年的1月1日0:00
              { [Op.lte]: new Date(Date.UTC(currentYear + 1, 0, 1, 0)) }, // 明年的1月1日0:00
            ],
          },
        ],
      },
    },
  };
  return query;
}

async function uniqueYearMonth(dataList) {
  const uniqueData = new Map();

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

async function getMonthData(currentDate, dataList) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentMonthData = dataList.find(
    item =>
      new Date(item.date).getMonth() === currentMonth - 1 &&
      new Date(item.date).getFullYear() === currentYear,
  );
  let lastMonthData;
  if (currentMonth === 1) {
    lastMonthData = dataList.find(
      item =>
        new Date(item.date).getMonth() === 11 &&
        new Date(item.date).getFullYear() === currentYear - 1,
    );
  } else {
    lastMonthData = dataList.find(
      item =>
        new Date(item.date).getMonth() === currentMonth - 2 &&
        new Date(item.date).getFullYear() === currentYear,
    );
  }
  return [currentMonthData, lastMonthData];
}

async function initializeMonthData(monthDataField, field, currentMonthData, lastMonthData) {
  if (currentMonthData) {
    monthDataField.current = currentMonthData[field] !== -1 ? currentMonthData[field] : null;
  }
  if (lastMonthData) {
    monthDataField.last = lastMonthData[field] !== -1 ? lastMonthData[field] : null;
  }
  if (monthDataField.current && monthDataField.last) {
    monthDataField.increase = monthDataField.current - monthDataField.last;
  }
}

async function initializeYearData(yearDataField, field, dataList, currentYear) {
  dataList.forEach(item => {
    const date = new Date(item.date);
    const year = date.getFullYear();
    if (year === currentYear) {
      if (item[field] !== -1) {
        yearDataField.current += item[field];
      }
    } else if (year === currentYear - 1) {
      if (item[field] !== -1) {
        yearDataField.last += item[field];
      }
    }
  });
  if (yearDataField.current && yearDataField.last) {
    yearDataField.increase = yearDataField.current - yearDataField.last;
  }
}

async function getDumpQuery(projectId, data, dataType, dateType) {
  const currentDate = sequelize.literal('CURDATE()');
  const insertedData = {
    projectId: projectId,
    date: currentDate,
    dateType: 2,
    dataType: 1,
    increasedValue: data.increase ? data.increase : null,
    totalValue: data.current ? data.current : null,
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

async function dumpGithubHistoryTable(projectId, monthData, yearData) {
  // 存入月相关数据（dateType=2），dataType=1为star；=2为contributor
  const queryStarMonth = await getDumpQuery(projectId, monthData.star, 1, 2);
  const queryContributorMonth = await getDumpQuery(projectId, monthData.contributor, 2, 2);
  await TrendHistory.upsert(queryStarMonth[0], queryStarMonth[1]);
  await TrendHistory.upsert(queryContributorMonth[0], queryContributorMonth[1]);
  // 存入年相关数据（dateType=1），dataType=1为star；=2为contributor
  const queryStarYear = await getDumpQuery(projectId, yearData.star, 1, 1);
  const queryContributorYear = await getDumpQuery(projectId, yearData.contributor, 2, 1);
  await TrendHistory.upsert(queryStarYear[0], queryStarYear[1]);
  await TrendHistory.upsert(queryContributorYear[0], queryContributorYear[1]);
}

async function dumpEvaluateHistoryTable(projectId, monthData, yearData) {
  // 存入月相关数据（dateType=2），dataType=3为生态评分；=4为质量评分
  const queryEcologyMonth = await getDumpQuery(projectId, monthData.ecology, 3, 2);
  const queryQualityMonth = await getDumpQuery(projectId, monthData.quality, 4, 2);
  await TrendHistory.upsert(queryEcologyMonth[0], queryEcologyMonth[1]);
  await TrendHistory.upsert(queryQualityMonth[0], queryQualityMonth[1]);
  // 存入年相关数据（dateType=1），dataType=3为生态评分；=4为质量评分
  const queryEcologyYear = await getDumpQuery(projectId, yearData.ecology, 3, 1);
  const queryQualityYear = await getDumpQuery(projectId, yearData.quality, 4, 1);
  await TrendHistory.upsert(queryEcologyYear[0], queryEcologyYear[1]);
  await TrendHistory.upsert(queryQualityYear[0], queryQualityYear[1]);
}

async function storeGithubHistory(projectId) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const query = await getQuery(projectId, currentYear);
  const githubHistoryRawList = await GithubProjectsHistory.findAll(query);
  const githubHistoryList = await uniqueYearMonth(githubHistoryRawList);
  // 当月和上月数据
  const monthRawData = await getMonthData(currentDate, githubHistoryList);
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
  await initializeMonthData(monthData.star, 'stars', currentMonthData, lastMonthData);
  await initializeMonthData(monthData.contributor, 'contributors', currentMonthData, lastMonthData);

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
  await initializeYearData(yearData.star, 'stars', githubHistoryList, currentYear);
  await initializeYearData(yearData.contributor, 'contributors', githubHistoryList, currentYear);
  await dumpGithubHistoryTable(projectId, monthData, yearData);
}

async function storeEvaluateScore(projectId) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const query = await getQuery(projectId, currentYear);
  const evaluationHistoryRawList = await EvaluationSummaryHistory.findAll(query);
  const evaluationHistoryList = await uniqueYearMonth(evaluationHistoryRawList);
  // 当月和上月数据
  const monthRawData = await getMonthData(currentDate, evaluationHistoryList);
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
  await initializeMonthData(monthData.ecology, 'ecologyScore', currentMonthData, lastMonthData);
  await initializeMonthData(monthData.quality, 'qualityScore', currentMonthData, lastMonthData);

  // 当年总量和增长量
  const yearData = {
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
  await initializeYearData(yearData.ecology, 'ecologyScore', evaluationHistoryList, currentYear);
  await initializeYearData(yearData.quality, 'qualityScore', evaluationHistoryList, currentYear);
  await dumpEvaluateHistoryTable(projectId, monthData, yearData);
}
