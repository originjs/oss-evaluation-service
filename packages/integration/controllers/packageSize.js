import { log } from 'debug';
import { PackageSizeDetail } from '@orginjs/oss-evaluation-data-model';
import sequelize from '../util/database.js';
import { sleep } from '../util/util.js';

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

  console.time('fetchTime');
  const response = await fetch(`https://bundlephobia.com/api/size?record=true&package=${name}${version ? (`@${version}`) : ''}`, requestOptions);
  console.timeEnd('fetchTime');
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
  // eslint-disable-next-line prefer-promise-reject-errors
  return Promise.reject({
    packageName: name,
    status: response.status,
    msg: error,
  });
}

export async function syncSinglePackageSize(name, version) {
  return getPackageSize(name, version)
    .then((row) => {
      PackageSizeDetail.upsert(row);
    })
    .catch((e) => {
      PackageSizeDetail.upsert({
        version: '',
        packageName: e.packageName,
        reason: `${e.status}:${e.msg?.substring(0, 1000)}`,
      });
      // if it fails, randomly sleep 1-5s
      sleep(Math.floor(Math.random() * 5) + 1);
    });
}

export async function syncAllPackageSize() {
  const query = `
    select package, detail.reason
    from project_packages packages
         left join package_size_detail detail
                   on packages.package = detail.package_name
        where detail.id is null
        and detail.reason is null
        and package is not null
`;

  const packageList = await sequelize.query(query, { type: sequelize.QueryTypes.SELECT });

  for (const { package: packageName } of packageList) {
    log(`get packageName:${packageName} size data`);
    await syncSinglePackageSize(packageName);
    const randomMs = Math.floor(Math.random() * 1000) + 1000;
    await sleep(randomMs);
  }
}

export async function syncPackageSizeHandler(req, res) {
  try {
    if (req.body.name) {
      await syncSinglePackageSize(req.body.name, req.body.version);
    } else {
      await syncAllPackageSize();
    }
    res.status(200);
  } catch (e) {
    res.status(500).json({ erorr: e.message });
  }
}
