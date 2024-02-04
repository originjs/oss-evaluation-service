import {PackageDownloadCountMapper} from '../models/PackageDownloadCount.js';

/**
 * 发送请求获取包下载量
 *
 * @param req 请求参数
 * @returns response 包下载量列表
 */
export async function getDownloadCount(req) {
    const start = req.body.start
    let end = req.body.end;
    const name = req.body.name;
    // 获取下载量
    let downloadCount
    try {
        downloadCount = await sendRequestGetDownloadCountByRange(start, end, name);
    } catch (e) {
        console.log(e);
        return;
    }
    let downloadCountList = [];
    for (let i = 0; i < downloadCount.downloads.length; i++) {
        let item = downloadCount.downloads[i];
        let d = new DownloadCountDO(item.day, downloadCount.package, item.downloads);
        downloadCountList.push(d);
    }

    if (downloadCountList.length > 0) {
        await insertOrUpdateBatchDownloadCount(downloadCountList);
    }
}

/**
 * 发送请求获取包下载量
 *
 * @param start 开始时间
 * @param end 结束时间
 * @param name 包明
 * @returns response 包下载量列表
 */
export async function sendRequestGetDownloadCountByRange(start, end, name) {
    const response = await fetch(`https://api.npmjs.org/downloads/range/${start}:${end}/${name}`);
    if (response.ok) {
        return response.json();
    }
    return {
        erorr: 'fetch package download count failed'
    }
}

/**
 * 发送请求获取包下载量
 *
 * @param start 开始时间
 * @param end 结束时间
 * @param name 包明
 * @returns response 包下载量列表
 */
export async function sendRequestGetDownloadCountByPoint(start, end, name) {
    const response = await fetch(`https://api.npmjs.org/downloads/point/${start}:${end}/${name}`);
    if (response.ok) {
        return response.json();
    }
    return {
        erorr: 'fetch package download count failed'
    }
}

/**
 * 包下载量实体
 */
class DownloadCountDO {
    constructor(date, package_name, download_count) {
        this.date = date;
        this.packageName = package_name;
        this.downloadCount = download_count;
    }
}

/**
 * 批量插入包下载量
 *
 * @param downloadCountList 包下载量列表
 * @returns void
 */
export async function insertBatchDownloadCount(downloadCountList) {
    PackageDownloadCountMapper.bulkCreate(downloadCountList).then(downloadCount => {
        console.log('Created DownloadCount:', downloadCount);
    })
        .catch(err => {
            console.error('Error creating DownloadCount:', err);
        });
}

/**
 * 批量插入或更新包下载量
 *
 * @param downloadCountList 包下载量列表
 * @returns void
 */
export async function insertOrUpdateBatchDownloadCount(downloadCountList) {
    for (let i = 0; i < downloadCountList.length; i++) {
        PackageDownloadCountMapper.upsert(downloadCountList[i]).then(downloadCount => {
            console.log('Created DownloadCount:', downloadCount);
        })
            .catch(err => {
                console.error('Error creating DownloadCount:', err);
            });
    }
}

