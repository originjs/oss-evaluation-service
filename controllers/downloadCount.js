import { Op } from 'sequelize';
import debug from 'debug';
import PackageDownloadCountMapper from '../models/PackageDownloadCount.js';
import ProjectPackageMapper from '../models/ProjectPackage.js';
import { getWeekOfYearList } from '../util/weekOfYearUtil.js';

export default syncDownloadCount;

export async function syncDownloadCount(req, res) {
  await getDownloadCount(req);
  res.status(200).json('ok');
}

export async function getDownloadCount(req) {
  const { startDate, endDate, projectId } = req.body;
  await getDownloadCountByMultiPackage(startDate, endDate, projectId);
  await getDownloadCountBySinglePackage(startDate, endDate, projectId);
}

async function getDownloadCountByMultiPackage(startDate, endDate, projectId) {
  const weekOfYearList = getWeekOfYearList(startDate, endDate == null ? new Date() : endDate);
  const projectCount = await ProjectPackageMapper.count({
    where: {
      package: {
        [Op.notLike]: '%/%',
      },
      project_id: {
        [Op.gte]: projectId,
      },
    },
  });
  const Page = 128;
  let begin = 0;
  for (begin; begin < projectCount; begin += Page) {
    const downloadCountList = [];
    const projectsList = await ProjectPackageMapper.findAll({
      attributes: ['project_id', 'package'],
      offset: begin,
      limit: Page,
      where: {
        package: {
          [Op.notLike]: '%/%',
        },
        project_id: {
          [Op.gte]: projectId,
        },
      },
      order: [['project_id', 'ASC']],
    });
    // Splicing batch query paths
    let packageName = `${projectsList[0].dataValues.package}`;
    for (let j = 1; j < projectsList.length; j += 1) {
      packageName += `,${projectsList[j].dataValues.package}`;
    }
    for (const weekOfYear of weekOfYearList) {
      await dealMultiPackage(weekOfYear, packageName, downloadCountList);
    }
    debug.log('getDownloadCountByMultiPackage:project_id:%s,packageName:%s', projectsList[0].dataValues.project_id, projectsList[0].dataValues.package);
    if (downloadCountList.length > 0) {
      await insertBatchDownloadCount(downloadCountList);
    }
  }
}

async function getDownloadCountBySinglePackage(startDate, endDate, projectId) {
  const weekOfYearList = getWeekOfYearList(startDate, endDate == null ? new Date() : endDate);
  const projectCount = await ProjectPackageMapper.count({
    where: {
      package: {
        [Op.like]: '%/%',
      },
      project_id: {
        [Op.gte]: projectId,
      },
    },
  });
  const Page = 128;
  let begin = 0;
  for (begin; begin < projectCount; begin += Page) {
    const projectsList = await ProjectPackageMapper.findAll({
      attributes: ['project_id', 'package'],
      offset: begin,
      limit: Page,
      where: {
        package: {
          [Op.like]: '%/%',
        },
        project_id: {
          [Op.gte]: projectId,
        },
      },
      order: [['project_id', 'ASC']],
    });
    for (const project of projectsList) {
      const packageName = project.dataValues.package;
      for (const weekOfYear of weekOfYearList) {
        await dealSinglePackage(weekOfYear, packageName);
      }
      debug.log('getDownloadCountBySinglePackage:project_id:%s,packageName:%s', project.dataValues.project_id, packageName);
    }
  }
}

async function dealMultiPackage(week, packageName, downloadCountList) {
  let downloadCountJson;
  try {
    downloadCountJson = await sendRequestByPoint(week.start, week.end, packageName);
  } catch (e) {
    debug.log(`${packageName} sendRequest error!!`);
    debug.log(e);
  }
  for (const key in downloadCountJson) {
    if (downloadCountJson.hasOwnProperty.call(key)) {
      const downloadCount = downloadCountJson[key];
      if (downloadCount == null) {
        continue;
      }
      downloadCountList.push({
        packageName: downloadCount.package,
        startDate: downloadCount.start,
        endDate: downloadCount.end,
        week: week.weekOfYear,
        downloads: downloadCount.downloads,
      });
    }
  }
}

async function dealSinglePackage(weekOfYear, packageName) {
  let downloadCountJson;
  try {
    downloadCountJson = await sendRequestByPoint(weekOfYear.start, weekOfYear.end, packageName);
  } catch (e) {
    debug.log(`${packageName} sendRequest error!!`);
    debug.log(e);
  }
  await insertOrUpdateDownloadCount({
    packageName: downloadCountJson.package,
    startDate: downloadCountJson.start,
    endDate: downloadCountJson.end,
    week: weekOfYear.weekOfYear,
    downloads: downloadCountJson.downloads,
  });
}

export async function sendRequestByRange(start, end, name) {
  const response = await fetch(`https://api.npmjs.org/downloads/range/${start}:${end}/${name}`);
  if (response.ok) {
    return response.json();
  }
  return {
    erorr: 'fetch package download count failed',
  };
}

export async function sendRequestByPoint(start, end, name) {
  const response = await fetch(`https://api.npmjs.org/downloads/point/${start}:${end}/${name}`);
  if (response.ok) {
    return response.json();
  }
  return {
    erorr: 'fetch package download count failed',
  };
}

export async function insertBatchDownloadCount(downloadCountList) {
  PackageDownloadCountMapper.bulkCreate(downloadCountList).then((downloadCount) => {
    debug.log('Created DownloadCount:', downloadCount);
  })
    .catch((err) => {
      debug.log('Error creating DownloadCount:', err);
    });
}

export async function insertOrUpdateBatchDownloadCount(downloadCountList) {
  for (const downloadCount of downloadCountList) {
    PackageDownloadCountMapper.upsert(downloadCount).then((item) => {
      debug.log('Created DownloadCount:', item);
    })
      .catch((err) => {
        debug.log('Error creating DownloadCount:', err);
      });
  }
}

export async function insertOrUpdateDownloadCount(downloadCount) {
  PackageDownloadCountMapper.upsert(downloadCount).then((item) => {
    debug.log('Created DownloadCount:', item);
  })
    .catch((err) => {
      debug.log('Error creating DownloadCount:', err);
    });
}
