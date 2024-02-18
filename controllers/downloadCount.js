import { Op } from 'sequelize';
import debug from 'debug';
import PackageDownloadCount from '../models/PackageDownloadCount.js';
import ProjectPackage from '../models/ProjectPackage.js';
import { getWeekOfYearList } from '../util/weekOfYearUtil.js';

const PAGE_SIEZ = 128;

export async function syncDownloadCount(req, res) {
  const {
    startDate,
    endDate,
    startId,
    endId,
  } = req.body;
  // await getNoneScopedPackageDownloadCount(startDate, endDate, startId, endId);
  await getScopedPackageDownloadCount(startDate, endDate, startId, endId);
  res.status(200).json('ok');
}

async function getNoneScopedPackageDownloadCount(startDate, endDate, startId, endId) {
  const weekOfYearList = getWeekOfYearList(startDate, endDate);
  let projectIdRange;
  if (endId) {
    projectIdRange = {
      [Op.gte]: startId,
      [Op.lte]: endId,
    };
  } else {
    projectIdRange = { [Op.gte]: startId };
  }
  const where = {
    package: {
      [Op.notLike]: '%/%',
    },
    project_id: projectIdRange,
  };

  const packageCount = await ProjectPackage.count({ where });
  for (let begin = 0; begin < packageCount; begin += PAGE_SIEZ) {
    const packageList = await ProjectPackage.findAll({
      offset: begin,
      limit: PAGE_SIEZ,
      where,
      order: [['project_id', 'ASC']],
    });
    // Splicing batch query paths
    const allPackageName = packageList.map((e) => e.package).join(',');
    for (const weekOfYear of weekOfYearList) {
      const downloadCountList = await dealMultiPackage(weekOfYear, allPackageName);
      if (downloadCountList.length > 0) {
        PackageDownloadCount.bulkCreate(downloadCountList).catch((err) => {
          debug.log('Error creating DownloadCount:', err);
        });
      }
    }
  }
}

async function getScopedPackageDownloadCount(startDate, endDate, startId, endId) {
  const weekOfYearList = getWeekOfYearList(startDate, endDate);
  let projectIdRange;
  if (endId) {
    projectIdRange = {
      [Op.gte]: startId,
      [Op.lte]: endId,
    };
  } else {
    projectIdRange = { [Op.gte]: startId };
  }
  const where = {
    package: {
      [Op.like]: '%/%',
    },
    project_id: projectIdRange,
  };
  const packageCount = await ProjectPackage.count({ where });
  for (let begin = 0; begin < packageCount; begin += PAGE_SIEZ) {
    const packageList = await ProjectPackage.findAll({
      offset: begin,
      limit: PAGE_SIEZ,
      where,
      order: [['project_id', 'ASC']],
    });
    for (const packageInfo of packageList) {
      debug.log('getScopedPackageDownloadCount ', packageInfo.package, packageInfo.projectId);
      for (const weekOfYear of weekOfYearList) {
        await dealSinglePackage(weekOfYear, packageInfo.package);
      }
    }
  }
}
async function dealSinglePackage(week, packageName) {
  try {
    const downloadCountJson = await sendRequestByPoint(week.start, week.end, packageName);
    PackageDownloadCount.upsert({
      packageName: downloadCountJson.package,
      startDate: downloadCountJson.start,
      endDate: downloadCountJson.end,
      week: week.weekOfYear,
      downloads: downloadCountJson.downloads,
    }).catch((err) => {
      debug.log('Error insert DownloadCount:', err);
    });
  } catch (e) {
    debug.log(`${packageName} sendRequest error!!`);
    debug.log(e);
  }
}

async function dealMultiPackage(week, packageName) {
  const downloadCountList = [];
  try {
    const downloadCountJson = await sendRequestByPoint(week.start, week.end, packageName);
    if (downloadCountJson.downloads !== undefined) {
      downloadCountList.push({
        packageName: downloadCountJson.package,
        startDate: downloadCountJson.start,
        endDate: downloadCountJson.end,
        week: week.weekOfYear,
        downloads: downloadCountJson.downloads,
      });
    } else {
      Object.values(downloadCountJson).forEach((element) => {
        downloadCountList.push({
          packageName: element.package,
          startDate: element.start,
          endDate: element.end,
          week: week.weekOfYear,
          downloads: element.downloads,
        });
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
    erorr: `fetch package download count failed:: ${response.statusText}`,
  };
}
