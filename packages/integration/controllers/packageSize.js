import {
  logger,
  PackageSizeDetail,
  ProjectPackage,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl, sleep } from '../util/util.js';
import { Op } from 'sequelize';

export async function getPackageSize(name, version) {
  const myHeaders = new Headers();
  myHeaders.append('User-Agent', 'Apifox/1.0.0 (https://apifox.com)');
  myHeaders.append('Accept', '*/*');
  myHeaders.append('Host', 'bundlephobia.com');
  myHeaders.append('Connection', 'keep-alive');
  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
  };

  const url = `https://bundlephobia.com/api/size?record=true&package=${name}${version ? `@${version}` : ''}`;
  const response = await fetch(url, requestOptions);
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

  const error = await response.text();
  logger.error(`The project:  ${url} get package size fail: ${error}`);
  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject({
    packageName: name,
    status: response.status,
    msg: error,
  });
}

/**
 * Synchronize Single Project Package Size
 * @param {Object} project project info
 * @returns {Promise<*>} inserted project package size
 */
export async function syncSingleProjectPackageSize(project) {
  const packageName = await ProjectPackage.findOne({
    where: {
      [Op.and]: [{ projectId: project.id }, { package: { [Op.ne]: null } }, { main_package: true }],
    },
    attributes: ['package'],
  });
  if (packageName) {
    await syncPackageSize(packageName.package);
  }
}

export async function syncAllProjectPackageSize() {
  const query = `
    select package, detail.reason
    from project_packages packages
         left join package_size_detail detail
                   on packages.package = detail.package_name
`;

  const packageList = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

  for (const { package: packageName } of packageList) {
    logger.info(`get packageName:${packageName} size data`);
    await syncPackageSize(packageName);
    const randomMs = Math.floor(Math.random() * 1000) + 1000;
    await sleep(randomMs);
  }
}

async function syncPackageSize(name, version) {
  return getPackageSize(name, version)
    .then(row => {
      PackageSizeDetail.upsert(row);
    })
    .catch(e => {
      PackageSizeDetail.upsert({
        version: '',
        packageName: e.packageName,
        reason: `${e.status}:${e.msg?.substring(0, 1000)}`,
        updateAt: Date.now(),
      });
      // if it fails, randomly sleep 1-5s
      sleep(Math.floor(Math.random() * 5) + 1);
    });
}

export async function syncSingleProjectPackageSizeHandler(req, res) {
  const { repoUrl: repoUrl } = req.params;
  const project = await getProjectByUrl(repoUrl);
  await syncSingleProjectPackageSize(project);
  res.status(200).send('success');
}

export async function syncPackageSizeHandler(req, res) {
  try {
    if (req.body.name) {
      await syncPackageSize(req.body.name, req.body.version);
    } else {
      await syncAllProjectPackageSize();
    }
    res.status(200);
  } catch (e) {
    res.status(500).json({ erorr: e.message });
  }
}
