import {PackageSizeInfo} from '../models/PackageSizeInfo.js';
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
        name: name,
        version: version,
        size_of_gzip: packageInfo.gzip,
        size: packageInfo.size,
        repository: packageInfo.repository
    };
    await PackageSizeInfo.upsert(row).then(info => {
        console.log('Upsert package size:', info);
    }).catch(err => {
        console.error("package size save to database failed:", err);
        throw new ServerError(err);
    });
    return row;
}

export async function getPackageSize(name, version) {
    const url = `https://bundlephobia.com/api/size?package=${name}@${version}&record=true`;
    const response = await axios.get(url);

    if (response.status == 200) {
        const assets = response.data.assets;
        const repository = response.data.repository;
        if (assets.length > 0 && response.data.repository.length > 0) {
            return {
                gzip: assets[0].gzip,
                size: assets[0].size,
                repository: repository
            };
        }
    }
    return {
        erorr: 'fetch package size failed'
    }
}
