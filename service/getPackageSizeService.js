import {PackageSizeDetail} from '../models/PackageSizeDetail.js';
import axios from 'axios'
import { ServerError } from '../util/error.js';

export async function syncSinglePackageSize(req, res, next) {
    const name = req.body.name
    const version = req.body.version;
    const packageInfo = await getPackageSize(name, version);
    if (packageInfo.erorr) {
        throw new ServerError(packageInfo.erorr);
    }
    const row = {
        package_name: name,
        version: packageInfo.version,
        gzip_sie: packageInfo.gzip,
        size: packageInfo.size,
        clone_url: packageInfo.repository,
        dependency_count: packageInfo.dependencyCount
    };
    await PackageSizeDetail.upsert(row).then(info => {
        console.log('Upsert package size:', info);
    }).catch(err => {
        console.error("package size save to database failed:", err);
        throw new ServerError(err);
    });
    return row;
}

export async function getPackageSize(name, version) {
    let url = `https://bundlephobia.com/api/size?package=${name}`;
    if (version != null) {
       url =  url + `@${version}&record=true`;
    }
    const response = await axios.get(url);

    if (response.status == 200) {
        const assets = response.data.assets;
        const repository = response.data.repository;
        const dependencyCount = response.data.dependencyCount;
        const version = response.data.version;
        if (assets.length > 0 && response.data.repository.length > 0) {
            return {
                gzip: assets[0].gzip,
                size: assets[0].size,
                repository: repository,
                dependencyCount: dependencyCount,
                version: version
            };
        }
    }
    return {
        erorr: 'fetch package size failed'
    }
}
