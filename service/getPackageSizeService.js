import axios from 'axios';
import debug from 'debug';
import { Op } from 'sequelize';
import PackageSizeDetail from '../models/PackageSizeDetail.js';
import { ServerError } from '../util/error.js';
import GithubProjects from '../models/GithubProjects.js';
import ProjectPackages from '../models/ProjectPackages.js';

export async function syncSinglePackageSize(req, res) {
  const { name } = req.body;
  const { version } = req.body;
  const packageInfo = await getPackageSize(name, version);
  if (packageInfo.erorr) {
    throw new ServerError(packageInfo.erorr);
  }
  const row = {
    package_name: packageInfo.name,
    version: packageInfo.version,
    gzip_size: packageInfo.gzip,
    size: packageInfo.size,
    clone_url: packageInfo.repository,
    dependency_count: packageInfo.dependencyCount,
  };
  await PackageSizeDetail.upsert(row).then((info) => {
    console.log('Upsert package size:', info);
  }).catch((err) => {
    console.error('package size save to database failed:', err);
    throw new ServerError(err);
  });
  return row;
}

export async function getPackageSize(name, version) {
  let url = `https://bundlephobia.com/api/size?package=${name}`;
  if (version != null) {
    url += `@${version}&record=true`;
  }
  try {
    const response = await axios.get(url);

    if (response.status === 200) {
      const { gzip } = response.data;
      const { size } = response.data;
      const { repository } = response.data;
      const { dependencyCount } = response.data;
      const { version } = response.data;
      const { name } = response.data;
      return {
        gzip,
        size,
        repository,
        dependencyCount,
        version,
        name,
      };
    }
  } catch (err) {
    debug.log('fetch fail:', name);
  }

  return {
    erorr: 'fetch package size failed',
  };
}

export async function getGitHubProjectPackageSize(req, res) {
  debug.log('packageSize数据集成启动');
  // 1. 获取数据库中的 github项目的包
  GithubProjects.hasOne(ProjectPackages, { foreignKey: 'project_id' });
  let packageNumber = 0;
  try {
    packageNumber = await GithubProjects.count({
      subQuery: false,
      include: [{
        model: ProjectPackages,
        attributes: ['package'],
        where: { package: { [Op.ne]: null } },
      }],
    });
  } catch (err) {
    debug.log('No packages need to be integrated!', err);
  }

  const Page = 100;
  let begin = 0;
  for (begin; begin < packageNumber; begin += Page) {
    // 获取 github project 包信息
    const packageList = await GithubProjects.findAll({
      subQuery: false,
      include: [{
        model: ProjectPackages,
        attributes: ['package'],
        where: { package: { [Op.ne]: null } },
      }],
      attributes: [],
      offset: begin,
      limit: Page,
    });

    const packageSizeList = [];

    for (const item of packageList) {
      if (item.project_package.dataValues.length == 0) {
        continue;
      }
      const packages = item.project_package.dataValues;
      const packageInfo = await getPackageSize(packages.package, null);
      if (packageInfo.erorr) {
        debug.log('包名: ', packages.package, ' 不存在 包大小的数据');
        continue;
      }
      packageSizeList.push(new PackageSizeDetailDto(
        packageInfo.name,
        packageInfo.version,
        packageInfo.gzip,
        packageInfo.size,
        packageInfo.repository,
        packageInfo.dependencyCount,
      ));
    }
    // 批量集成
    await insertOrUpdateBatchPackageSize(packageSizeList);
    debug.log('package size插入了: ', packageList.length, ' 个project的数据');
  }

  res.status(200).data('数据集成完毕');
}

/**
 * 批量插入或更新包大小数据
 *
 * @param packageSizeList 包大小列表
 * @returns void
 */
export async function insertOrUpdateBatchPackageSize(packageSizeList) {
  for (let i = 0; i < packageSizeList.length; i += 1) {
    PackageSizeDetail.upsert(packageSizeList[i]).then(() => {
      console.log('Created packageSize:', packageSizeList[i].package_name);
    })
      .catch((err) => {
        console.error('Error creating packageSize:', err);
      });
  }
}

/**
 * packageSize 实体类数据
 */
class PackageSizeDetailDto {
  constructor(
    package_name,
    version,
    gzip_size,
    size,
    clone_url,
    dependency_count,
  ) {
    this.package_name = package_name;
    this.version = version;
    this.gzip_size = gzip_size;
    this.size = size;
    this.clone_url = clone_url;
    this.dependency_count = dependency_count;
  }
}
