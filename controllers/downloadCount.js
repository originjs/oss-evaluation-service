import debug from 'debug';
import fetch from '@adobe/node-fetch-retry';
import sequelize from '../util/database.js';
import PackageDownloadCount from '../models/PackageDownloadCount.js';
import { getWeekOfYearList } from '../util/weekOfYearUtil.js';

const PAGE_SIZE = 128;

const queryPackageCountStart = `
    select count(*) as count
    from project_packages
         left join (SELECT package_name
                    FROM package_download_count
                    where !isnull(package_name)
                      and week = :maxWeek) as base on package = package_name
    where
        project_id >= :startId
        and project_id <= :endId
        and isnull(package_name)
        and !isnull(package)`;

const queryPackageCountEnd = `
        order by project_id, package
    `;

const queryScopedPackage = `
        and package like '%/%'
    `;

const queryNoneScopedPackage = `
        and package not like '%/%'
    `;

const queryPackageStart = `
    select project_id as projectId, package, package_name as packageName
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

const queryPackageEnd = `
        order by project_id, package
        limit :begin, :PAGE_SIZE
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
  const needSyncPackageNum = await sequelize.query(
    queryPackageCountStart + queryNoneScopedPackage + queryPackageCountEnd,
    {
      replacements: { startId, endId, maxWeek },
      type: sequelize.QueryTypes.SELECT,
    },
  );

  const packageCount = needSyncPackageNum[0].count;
  for (let begin = 0; begin < packageCount; begin += PAGE_SIZE) {
    const packageList = await sequelize.query(
      queryPackageStart + queryNoneScopedPackage + queryPackageEnd,
      {
        replacements: {
          startId, endId, maxWeek, begin, PAGE_SIZE,
        },
        type: sequelize.QueryTypes.SELECT,
      },
    );
    // Splicing batch query paths
    const allPackageName = packageList.map((e) => e.package).join(',');
    for (const weekOfYear of weekOfYearList) {
      const downloadCountList = await dealMultiPackage(weekOfYear, allPackageName);
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
  const needSyncPackageNum = await sequelize.query(
    queryPackageCountStart + queryScopedPackage + queryPackageCountEnd,
    { replacements: { startId, endId, maxWeek }, type: sequelize.QueryTypes.SELECT },
  );

  const packageCount = needSyncPackageNum[0].count;
  for (let begin = 0; begin < packageCount; begin += PAGE_SIZE) {
    const packageList = await sequelize.query(
      queryPackageStart + queryScopedPackage + queryPackageEnd,
      {
        replacements: {
          startId, endId, maxWeek, begin, PAGE_SIZE,
        },
        type: sequelize.QueryTypes.SELECT,
      },
    );
    for (const packageInfo of packageList) {
      debug.log('---------------getScopedPackageDownloadCount---------------package:%s, projectId:%s, total:%s', packageInfo.package, packageInfo.projectId, packageCount);
      for (const weekOfYear of weekOfYearList) {
        const hasError = await dealSinglePackage(weekOfYear, packageInfo.package);
        if (hasError) {
          return;
        }
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
      downloadCountList.push({
        packageName: downloadCountJson.package,
        startDate: downloadCountJson.start,
        endDate: downloadCountJson.end,
        week: week.weekOfYear,
        downloads: downloadCountJson.downloads,
      });
    } else {
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
