import {PackageDownloadCountMapper} from '../models/PackageDownloadCount.js';
import {WeekOfMonthMapper} from "../models/weekOfMonth.js";
import {ProjectPackageMapper} from "../models/ProjectPackage.js";
import {Op} from "sequelize";

/**
 * 集成获取包下载量
 *
 * @param req 请求参数
 * @returns response 包下载量列表
 */
export async function getDownloadCount(req) {
    const startDate = req.body.startDate;
    await getDownloadCountByMultiPackage(startDate);
    await getDownloadCountBySinglePackage(startDate);
}

/**
 * 集成获取多个包下载量
 */
async function getDownloadCountByMultiPackage(startDate) {
    // 当前日期
    let currentDate = new Date();
    let weekOfMonthList = await WeekOfMonthMapper.findAll({
        where: {
            start: {
                [Op.gte]: startDate
            },
            end: {
                [Op.lte]: currentDate
            }
        }
    });
    let projectCount = await ProjectPackageMapper.count({
        where: {
            package: {
                [Op.notLike]: '%/%'
            }
        }
    });
    const Page = 128;
    let begin = 0;
    for (begin; begin < projectCount; begin += Page) {
        let downloadCountList = [];
        let projectsList = await ProjectPackageMapper.findAll({
            attributes: ['package'],
            offset: begin,
            limit: Page,
            where: {
                package: {
                    [Op.notLike]: '%/%'
                }
            }
        });
        // 拼接批量查询路径
        let packageName = "" + projectsList[0].dataValues.package;
        for (let j = 1; j < projectsList.length; j++) {
            packageName += "," + projectsList[j].dataValues.package;
        }
        for (let i = 0; i < weekOfMonthList.length; i++) {
            let hasError = await dealDownloadCountByMultiPackage(weekOfMonthList[i].dataValues, packageName, downloadCountList);
            if (hasError) {
                return
            }
        }
        console.log('getDownloadCountByMultiPackage:packageName:' + projectsList[0].dataValues.package)
        if (downloadCountList.length > 0) {
            await insertBatchDownloadCount(downloadCountList);
        }
    }
}

/**
 * 集成获取单个包下载量
 */
async function getDownloadCountBySinglePackage(startDate) {
    // 当前日期
    let currentDate = new Date();
    let weekOfMonthList = await WeekOfMonthMapper.findAll({
        where: {
            start: {
                [Op.gte]: startDate
            },
            end: {
                [Op.lte]: currentDate
            }
        }
    });
    let projectCount = await ProjectPackageMapper.count({
        where: {
            package: {
                [Op.like]: '%/%'
            }
        }
    });
    const Page = 128;
    let begin = 0;
    for (begin; begin < projectCount; begin += Page) {
        let downloadCountList = [];
        let projectsList = await ProjectPackageMapper.findAll({
            attributes: ['package'],
            offset: begin,
            limit: Page,
            where: {
                package: {
                    [Op.like]: '%/%'
                }
            }
        });
        for (let i = 0; i < projectsList.length; i++) {
            let packageName = projectsList[i].dataValues.package;
            for (let j = 0; j < weekOfMonthList.length; j++) {
                let hasError = await dealDownloadCountBySinglePackage(weekOfMonthList[j].dataValues, packageName, downloadCountList);
                if (hasError) {
                    return
                }
            }
            console.log('getDownloadCountBySinglePackage:packageName:' + packageName)
        }
        if (downloadCountList.length > 0) {
            await insertBatchDownloadCount(downloadCountList);
        }
    }
}

/**
 * 解析多包响应体体下载量数据
 *
 * @param weekOfMonth 月第几周
 * @param packageName 包名
 * @param downloadCountList 下载量列表
 */
async function dealDownloadCountByMultiPackage(weekOfMonth, packageName, downloadCountList) {
    // 获取下载量
    let downloadCountMap;
    let flag = false;
    try {
        downloadCountMap = await sendRequestGetDownloadCountByPoint(weekOfMonth.start, weekOfMonth.end, packageName);
    } catch (e) {
        console.log(packageName + " sendRequest error!!")
        console.log(e);
        flag = true
    }
    if (flag) {
        return flag
    }
    for (let key in downloadCountMap) {
        if (downloadCountMap.hasOwnProperty(key)) {
            let downloadCount = downloadCountMap[key]
            if (downloadCount == null) {
                continue;
            }
            let d = new DownloadCountDO(downloadCount.package, downloadCount.start, downloadCount.end, weekOfMonth.weekOfMonth, downloadCount.downloads);
            downloadCountList.push(d);
        }
    }
}

/**
 * 解析单包响应体体下载量数据
 *
 * @param weekOfMonth 月第几周
 * @param packageName 包名
 * @param downloadCountList 下载量列表
 */
async function dealDownloadCountBySinglePackage(weekOfMonth, packageName, downloadCountList) {
    // 获取下载量
    let downloadCountMap;
    let flag = false;
    try {
        downloadCountMap = await sendRequestGetDownloadCountByPoint(weekOfMonth.start, weekOfMonth.end, packageName);
    } catch (e) {
        console.log(packageName + " sendRequest error!!")
        console.log(e);
        flag = true
    }
    if (flag) {
        return flag
    }
    let d = new DownloadCountDO(downloadCountMap.package, downloadCountMap.start, downloadCountMap.end, weekOfMonth.weekOfMonth, downloadCountMap.downloads);
    downloadCountList.push(d);
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
    constructor(packageName, startDate, endDate, week, downloads) {
        this.packageName = packageName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.week = week;
        this.downloads = downloads;
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

