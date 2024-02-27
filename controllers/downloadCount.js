import debug from 'debug';
import fetch from '@adobe/node-fetch-retry';
import { chunk } from 'underscore';
import sequelize from '../util/database.js';
import PackageDownloadCount from '../models/PackageDownloadCount.js';
import { getWeekOfYearList } from '../util/weekOfYearUtil.js';

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

export async function syncNoneScopedPackageDownloadCount(req, res) {
  const {
    startDate,
    endDate,
    startId,
    endId,
  } = req.body;
  await getNoneScopedPackageDownloadCount(startDate, endDate, startId, endId);
  res.status(200).json('ok');
}

export async function syncScopedPackageDownloadCount(req, res) {
  const {
    startDate,
    endDate,
    startId,
    endId,
  } = req.body;
  await getScopedPackageDownloadCount(startDate, endDate, startId, endId);
  res.status(200).json('ok');
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
  const needSyncPackageNumList = chunk(needSyncPackage, PAGE_SIZE);
  for (const packageNameSlice of needSyncPackageNumList) {
    // Splicing batch query paths
    const packageNameStr = packageNameSlice.map((e) => e.package).join(',');
    for (const weekOfYear of weekOfYearList) {
      const downloadCountList = await dealMultiPackage(weekOfYear, packageNameStr);
      if (downloadCountList.length > 0) {
        for (const downloadCount of downloadCountList) {
          PackageDownloadCount.upsert(downloadCount).catch((err) => {
            debug.log('Error creating DownloadCount:', err);
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
    debug.log('---------------getScopedPackageDownloadCount---------------package:%s, projectId:%s, total:%s, current:%s', packageInfo.package, packageInfo.projectId, needSyncPackage.length, current += 1);
    for (const weekOfYear of weekOfYearList) {
      const hasError = await dealSinglePackage(weekOfYear, packageInfo.package);
      if (hasError) {
        return;
      }
    }
  }
}
async function dealSinglePackage(week, packageName) {
  try {
    const downloadCountJson = await sendRequestByPoint(week.start, week.end, packageName);
    if (downloadCountJson.error === undefined) {
      PackageDownloadCount.upsert({
        packageName: downloadCountJson.package,
        startDate: downloadCountJson.start,
        endDate: downloadCountJson.end,
        week: week.weekOfYear,
        downloads: downloadCountJson.downloads,
      }).catch((err) => {
        debug.log('Error insert DownloadCount:', err);
      });
    }
  } catch (e) {
    debug.log(`${packageName} sendRequest error!!`);
    debug.log(e);
    return true;
  }
  return false;
}

async function dealMultiPackage(week, packageName) {
  const downloadCountList = [];
  try {
    const downloadCountJson = await sendRequestByPoint(week.start, week.end, packageName);
    if (downloadCountJson.error === undefined) {
      Object.values(downloadCountJson).forEach((element) => {
        if (element != null) {
          downloadCountList.push({
            packageName: element.package,
            startDate: element.start,
            endDate: element.end,
            week: week.weekOfYear,
            downloads: element.downloads,
          });
        }
      });
    }
  } catch (e) {
    debug.log(`${packageName} sendRequest error!!`);
    debug.log(e);
  }
  return downloadCountList;
}

export async function sendRequestByPoint(start, end, name) {
  const response = await fetch(
    `https://api.npmjs.org/downloads/point/${start}:${end}/${name}`,
    {
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
    },
  );
  if (response.ok) {
    return response.json();
  }
  return {
    error: `fetch package download count failed:: ${response.statusText}`,
  };
}
