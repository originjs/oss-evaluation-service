import {
  GithubProjects,
  EvaluationSummaryHistory,
  TrendHistory,
  logger,
  GithubProjectsHistory,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import {
  firstDayOfPreviousMonth,
  firstDayOfPreviousYear,
  mondayOfPreviousWeek,
  isFirstDayOfMonth,
  isFirstDayOfWeek,
  isFirstDayOfYear,
} from '@orginjs/oss-evaluation-util';

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
    await storeEvaluateScore(project.id, date);
  }
}

/**
 * Stores the evaluation trend history for a specific project or all projects.
 *
 * @export
 * @param {number|null} projectId - The ID of the project to update. If null, updates all projects.
 * @param {dayjs.Dayjs} dayjsDate - The date for which to store the evaluation trend history.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function storeEvaluateTrendHistory(projectId, dayjsDate) {
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
    await storeEvaluateScore(project.id, dayjsDate);
  }
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
  if (!res.length) {
    logger.warn(
      `[trendHistory] ${date} is not the first day of the month or week, no logic is executed`,
    );
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
      attributes: ['stars', 'contributors'],
      where: {
        date: dateInfo.currentDate.toDate(),
        projectId,
      },
    });
    const previousGithubInfo = await GithubProjectsHistory.findOne({
      attributes: ['stars', 'contributors'],
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

/**
 * Stores the evaluation scores for a given project and date.
 * It retrieves the current and previous evaluation scores, calculates
 * the increase in scores, and upserts the trend data into the TrendHistory table.
 *
 * @param {number} projectId - The ID of the project for which to store the evaluation scores.
 * @param {dayjs.Date} dayjsDate - The date for which to calculate the evaluation scores.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export async function storeEvaluateScore(projectId, dayjsDate) {
  const dateInfos = getCalculateDateAndType(dayjsDate);
  const propertyTypes = [
    { dataType: DATA_TYPE.ECOLOGY, name: 'ecologyScore' },
    { dataType: DATA_TYPE.QUALITY, name: 'qualityScore' },
  ];
  for (const dateInfo of dateInfos) {
    const current = await EvaluationSummaryHistory.findOne({
      attributes: ['ecologyScore', 'qualityScore'],
      where: {
        date: dateInfo.currentDate.toDate(),
        projectId,
      },
    });
    const previous = await EvaluationSummaryHistory.findOne({
      attributes: ['ecologyScore', 'qualityScore'],
      where: {
        date: dateInfo.previousDate.toDate(),
        projectId,
      },
    });
    for (const property of propertyTypes) {
      const updateData = {
        projectId,
        date: dayjsDate.toDate(),
        dateType: dateInfo.dateType,
        dataType: property.dataType,
        // any null then increment is null
        increasedValue:
          current?.[property.name] == null || previous?.[property.name] == null
            ? null
            : current[property.name] - previous[property.name],
        totalValue: current?.[property.name],
      };
      await TrendHistory.upsert(updateData);
    }
  }
}
