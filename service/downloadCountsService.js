import { Op } from 'sequelize';
import debug from 'debug';
import PackageDownloadCountMapper from '../models/PackageDownloadCount.js';
import WeekOfMonthMapper from '../models/weekOfMonth.js';
import ProjectPackageMapper from '../models/ProjectPackage.js';

export async function getDownloadCount(req) {
  const { startDate } = req.body;
  const { projectId } = req.body;
  await getDownloadCountByMultiPackage(startDate, projectId);
  await getDownloadCountBySinglePackage(startDate, projectId);
}

async function getDownloadCountByMultiPackage(startDate, projectId) {
  const currentDate = new Date();
  const weekOfMonthList = await WeekOfMonthMapper.findAll({
    where: {
      start: {
        [Op.gte]: startDate,
      },
      end: {
        [Op.lte]: currentDate,
      },
    },
  });
  const projectCount = await ProjectPackageMapper.count({
    where: {
      package: {
        [Op.notLike]: '%/%',
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
    for (const weekOfMonth of weekOfMonthList) {
      const hasError = await dealDownloadCountByMultiPackage(weekOfMonth.dataValues, packageName, downloadCountList);
      if (hasError) {
        return;
      }
    }
    debug.log('getDownloadCountByMultiPackage:project_id:%s,packageName:%s', projectsList[0].dataValues.project_id, projectsList[0].dataValues.package);
    if (downloadCountList.length > 0) {
      await insertBatchDownloadCount(downloadCountList);
    }
  }
}

async function getDownloadCountBySinglePackage(startDate, projectId) {
  const currentDate = new Date();
  const weekOfMonthList = await WeekOfMonthMapper.findAll({
    where: {
      start: {
        [Op.gte]: startDate,
      },
      end: {
        [Op.lte]: currentDate,
      },
    },
  });
  const projectCount = await ProjectPackageMapper.count({
    where: {
      package: {
        [Op.like]: '%/%',
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
      for (const weekOfMonth of weekOfMonthList) {
        const hasError = await dealDownloadCountBySinglePackage(weekOfMonth.dataValues, packageName);
        if (hasError) {
          return;
        }
      }
      debug.log('getDownloadCountBySinglePackage:project_id:%s,packageName:%s', project.dataValues.project_id, packageName);
    }
  }
}

async function dealDownloadCountByMultiPackage(weekOfMonth, packageName, downloadCountList) {
  let downloadCountJson;
  let flag = false;
  try {
    downloadCountJson = await sendRequestGetDownloadCountByPoint(weekOfMonth.start, weekOfMonth.end, packageName);
  } catch (e) {
    debug.log(`${packageName} sendRequest error!!`);
    debug.log(e);
    flag = true;
  }
  if (flag) {
    return flag;
  }
  for (const key in downloadCountJson) {
    if (downloadCountJson.hasOwnProperty(key)) {
      const downloadCount = downloadCountJson[key];
      if (downloadCount == null) {
        continue;
      }
      downloadCountList.push({
        packageName: downloadCountJson.package,
        startDate: downloadCountJson.start,
        endDate: downloadCountJson.end,
        week: weekOfMonth.weekOfMonth,
        downloads: downloadCount.downloads,
      });
    }
  }
  return flag;
}

async function dealDownloadCountBySinglePackage(weekOfMonth, packageName) {
  let downloadCountJson;
  let flag = false;
  try {
    downloadCountJson = await sendRequestGetDownloadCountByPoint(weekOfMonth.start, weekOfMonth.end, packageName);
  } catch (e) {
    debug.log(`${packageName} sendRequest error!!`);
    debug.log(e);
    flag = true;
  }
  if (flag) {
    return flag;
  }
  await insertOrUpdateDownloadCount({
    packageName: downloadCountJson.package,
    startDate: downloadCountJson.start,
    endDate: downloadCountJson.end,
    week: weekOfMonth.weekOfMonth,
    downloads: downloadCountJson.downloads,
  });
  return flag;
}

export async function sendRequestGetDownloadCountByRange(start, end, name) {
  const response = await fetch(`https://api.npmjs.org/downloads/range/${start}:${end}/${name}`);
  if (response.ok) {
    return response.json();
  }
  return {
    erorr: 'fetch package download count failed',
  };
}

export async function sendRequestGetDownloadCountByPoint(start, end, name) {
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
      debug.error('Error creating DownloadCount:', err);
    });
}

export async function insertOrUpdateBatchDownloadCount(downloadCountList) {
  for (const downloadCount of downloadCountList) {
    PackageDownloadCountMapper.upsert(downloadCount).then((item) => {
      debug.log('Created DownloadCount:', item);
    })
      .catch((err) => {
        debug.error('Error creating DownloadCount:', err);
      });
  }
}

export async function insertOrUpdateDownloadCount(downloadCount) {
  PackageDownloadCountMapper.upsert(downloadCount).then((item) => {
    debug.log('Created DownloadCount:', item);
  })
    .catch((err) => {
      debug.error('Error creating DownloadCount:', err);
    });
}
