import debug from 'debug';
import { Op } from 'sequelize';
import PackageSizeDetail from '../models/PackageSizeDetail.js';
import { ServerError } from '../util/error.js';
import GithubProjects from '../models/GithubProjects.js';
import ProjectPackages from '../models/ProjectPackages.js';

export async function getPackageSize(name, version) {
  let url = `https://bundlephobia.com/api/size?package=${name}`;
  if (version) {
    url = `${url}@${version}`;
  }
  try {
    const response = await fetch(url);
    if (response.ok) {
      const body = await response.json();
      return {
        gzipSize: body.gzip,
        size: body.size,
        cloneUrl: body.repository,
        dependencyCount: body.dependencyCount,
        version: body.version,
        packageName: body.name,
      };
    }
  } catch (err) {
    debug.log('fetch package size fail:', err);
  }
  return { erorr: 'fetch package size failed' };
}

export async function syncSinglePackageSize(name, version) {
  const row = await getPackageSize(name, version);
  if (row.erorr) {
    throw new ServerError(row.erorr);
  }
  await PackageSizeDetail.upsert(row);
  return row;
}

export async function syncAllPackageSize() {
  const packageList = await GithubProjects.findAll({
    subQuery: false,
    include: [{
      model: ProjectPackages,
      attributes: ['package'],
      where: { package: { [Op.ne]: null } },
    }],
  });

  for (const item of packageList) {
    if (item.ProjectPackage.dataValues.length === 0) {
      continue;
    }
    const packages = item.ProjectPackage.dataValues;
    const packageInfo = await syncSinglePackageSize(packages.package);
    if (packageInfo.erorr) {
      debug.log('package name: ', packages.package, ' there is no data with package size present');
      continue;
    }
  }
}

export async function syncPackageSizeHandler(req, res) {
  try {
    if (req.body.name) {
      syncSinglePackageSize(req.body.name, req.body.version);
    }
    const result = await syncAllPackageSize();
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ erorr: e.message });
  }
}
