import fetch from '@adobe/node-fetch-retry';
import { chunk } from 'underscore';
import {
  PackageDownloadCount,
  GithubProjects,
  sequelize,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { getWeekOfYearList } from '@orginjs/oss-evaluation-util';
import { getProjectByUrl } from '../util/util.js';
import Dayjs from 'dayjs';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';

const PAGE_SIZE = 128;

const QUERY_PACKAGE_START = `
    select project_id as projectId, package
    from project_packages
         left join (SELECT package_name
                    FROM package_download_count
                    where !isnull(package_name)
                      and week = :maxWeek) as base on package = package_name
    where
        project_id >= :startId
        and project_id <= :endId
        and isnull(package_name)
        and !isnull(package)
        and package != ''
        and main_package = 1
    `;

const QUERY_SCOPED_PACKAGE = `
        and package like '%/%'
    `;

const QUERY_NONE_SCOPED_PACKAGE = `
        and package not like '%/%'
    `;

const QUERY_PACKAGE_END = `
        order by project_id, package
    `;

export async function syncAllProjectPackageDownloadCountHandler(req, res) {
  const { startDate, endDate } = req.body;
  await syncAllProjectPackageDownloadCount({ startDate, endDate });
  res.status(200).json('ok');
}

export async function syncSingleProjectPackageDownloadCountHandler(req, res) {
  const { startDate, endDate, repoUrl } = req.body;
  const project = await getProjectByUrl(repoUrl);
  await syncSingleProjectPackageDownloadCount(project, { startDate, endDate });
  res.status(200).json('ok');
}

/**
 * syncAllProjectPackageDownloadCount
 *
 * @param {Object} options
 * @param {string} [options.beginDate]  integrate  begin date
 * @param {string} [options.endDate] integrate end date
 */
async function syncAllProjectPackageDownloadCount(options) {
  const maxId = await GithubProjects.max('id');
  const minId = await GithubProjects.min('id');
  await getNoneScopedPackageDownloadCount(options.startDate, options.endDate, minId, maxId);
  await getScopedPackageDownloadCount(options.startDate, options.endDate, minId, maxId);
}

/**
 * syncAllProjectPackageDownloadCount
 *
 * @param {project} project info
 * @param {Object} options
 * @param {string} [options.beginDate]  integrate  begin date
 * @param {string} [options.endDate] integrate end date
 */
export async function syncSingleProjectPackageDownloadCount(project, options) {
  await getNoneScopedPackageDownloadCount(
    options.startDate,
    options.endDate,
    project.id,
    project.id,
  );
  await getScopedPackageDownloadCount(options.startDate, options.endDate, project.id, project.id);
}

async function getNoneScopedPackageDownloadCount(startDate, endDate, startId, endId) {
  const weekOfYearList = getWeekOfYearList(startDate, endDate);
  const maxWeek = weekOfYearList[weekOfYearList.length - 1].weekOfYear;
  const needSyncPackage = await sequelize.query(
    QUERY_PACKAGE_START + QUERY_NONE_SCOPED_PACKAGE + QUERY_PACKAGE_END,
    {
      replacements: { startId, endId, maxWeek },
      type: sequelize.QueryTypes.SELECT,
    },
  );
  const packageToProjectIdMap = needSyncPackage.reduce(
    (map, obj) => map.set(obj.package, obj.projectId),
    new Map(),
  );
  const needSyncPackageNumList = chunk(needSyncPackage, PAGE_SIZE);
  for (const packageNameSlice of needSyncPackageNumList) {
    // Splicing batch query paths
    const packageNameStr = packageNameSlice.map(e => e.package).join(',');
    for (const weekOfYear of weekOfYearList) {
      const downloadCountList = await dealMultiPackage(
        weekOfYear,
        packageNameStr,
        packageToProjectIdMap,
      );
      if (downloadCountList.length > 0) {
        for (const downloadCount of downloadCountList) {
          PackageDownloadCount.upsert(downloadCount).catch(err => {
            logger.error('Error creating DownloadCount:', err);
          });
        }
      }
    }
  }
}

async function getScopedPackageDownloadCount(startDate, endDate, startId, endId) {
  const weekOfYearList = getWeekOfYearList(startDate, endDate);
  const maxWeek = weekOfYearList[weekOfYearList.length - 1].weekOfYear;
  const needSyncPackage = await sequelize.query(
    QUERY_PACKAGE_START + QUERY_SCOPED_PACKAGE + QUERY_PACKAGE_END,
    { replacements: { startId, endId, maxWeek }, type: sequelize.QueryTypes.SELECT },
  );
  let current = 0;
  for (const packageInfo of needSyncPackage) {
    logger.info(
      '---------------getScopedPackageDownloadCount---------------package:%s, projectId:%s, total:%s, current:%s',
      packageInfo.package,
      packageInfo.projectId,
      needSyncPackage.length,
      (current += 1),
    );
    for (const weekOfYear of weekOfYearList) {
      const hasError = await dealSinglePackage(weekOfYear, packageInfo);
      if (hasError) {
        return;
      }
    }
  }
}
async function dealSinglePackage(week, packageInfo) {
  try {
    const downloadCountJson = await sendRequestByPoint(week.start, week.end, packageInfo.package);
    if (downloadCountJson.error === undefined) {
      PackageDownloadCount.upsert({
        projectId: packageInfo.projectId,
        packageName: downloadCountJson.package,
        startDate: downloadCountJson.start,
        endDate: downloadCountJson.end,
        week: week.weekOfYear,
        downloads: downloadCountJson.downloads,
      }).catch(err => {
        logger.error('Error insert DownloadCount:', err);
      });
    }
  } catch (e) {
    logger.error(`${packageInfo.package} sendRequest error!!`);
    logger.error(e);
    return true;
  }
  return false;
}

async function dealMultiPackage(week, packageName, packageToProjectIdMap) {
  const downloadCountList = [];
  try {
    const downloadCountJson = await sendRequestByPoint(week.start, week.end, packageName);
    if (downloadCountJson.error === undefined) {
      if (downloadCountJson.package != null) {
        downloadCountList.push({
          projectId: packageToProjectIdMap.get(downloadCountJson.package),
          packageName: downloadCountJson.package,
          startDate: downloadCountJson.start,
          endDate: downloadCountJson.end,
          week: week.weekOfYear,
          downloads: downloadCountJson.downloads,
        });
      } else {
        Object.values(downloadCountJson).forEach(element => {
          if (element != null) {
            downloadCountList.push({
              projectId: packageToProjectIdMap.get(element.package),
              packageName: element.package,
              startDate: element.start,
              endDate: element.end,
              week: week.weekOfYear,
              downloads: element.downloads,
            });
          }
        });
      }
    }
  } catch (e) {
    logger.error(`${packageName} sendRequest error!!`);
    logger.error(e);
  }
  return downloadCountList;
}

export async function sendRequestByPoint(start, end, name) {
  const response = await fetch(`https://api.npmjs.org/downloads/point/${start}:${end}/${name}`, {
    retryOptions: {
      retryMaxDuration: 3600000, // 60 min retry duration
      retryInitialDelay: 100,
    },
    headers: {
      'User-Agent': 'Apifox/1.0.0 (https://apifox.com)',
      Accept: '*/*',
      Host: 'api.npmjs.org',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    },
  });
  if (response.ok) {
    return response.json();
  }
  return {
    error: `fetch package download count failed:: ${response.statusText}`,
  };
}

export async function packageDownloadCountScheduler() {
  logger.info(
    '[Integration][PackageDownloadCount] ProjectPackageDownloadCount Integration Job start',
  );
  let startTime = process.hrtime();
  const queryLastDate = `select max(end_date) as endDate from package_download_count;`;
  const lastDate = await sequelize.query(queryLastDate, {
    type: sequelize.QueryTypes.SELECT,
  });
  const beginDate = new Dayjs(lastDate[0].endDate).add(1, 'day');
  const endDate = new Dayjs(new Date());
  await syncAllProjectPackageDownloadCount({ beginDate, endDate });
  let endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][ProjectPackageDownloadCount] ProjectPackageDownloadCount End!, 
          The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}

// Add monitoring to all task functions in your scheduled task
export const packageDownloadCountTimer = addMonitoringToTask(
  packageDownloadCountScheduler,
  'packageDownloadCountTimer',
  'Scheduled integration package download count',
);
