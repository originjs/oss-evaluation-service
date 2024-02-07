import {PackageDownloadCountMapper} from '../models/PackageDownloadCount.js';
import {WeekOfMonthMapper} from "../models/weekOfMonth.js";
import {ProjectPackageMapper} from "../models/ProjectPackage.js";
import {Op} from "sequelize";

export async function getDownloadCount(req) {
    const startDate = req.body.startDate;
    const projectId = req.body.projectId;
    await getDownloadCountByMultiPackage(startDate, projectId);
    await getDownloadCountBySinglePackage(startDate, projectId);
}

async function getDownloadCountByMultiPackage(startDate, projectId) {
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
            attributes: ['project_id', 'package'],
            offset: begin,
            limit: Page,
            where: {
                package: {
                    [Op.notLike]: '%/%'
                },
                project_id: {
                    [Op.gte]: projectId
                }
            },
            order: [['project_id', 'ASC']]
        });
        // Splicing batch query paths
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
        console.log('getDownloadCountByMultiPackage:project_id:%s,packageName:%s', projectsList[0].dataValues.project_id, projectsList[0].dataValues.package)
        if (downloadCountList.length > 0) {
            await insertBatchDownloadCount(downloadCountList);
        }
    }
}


async function getDownloadCountBySinglePackage(startDate, projectId) {
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
        let projectsList = await ProjectPackageMapper.findAll({
            attributes: ['project_id', 'package'],
            offset: begin,
            limit: Page,
            where: {
                package: {
                    [Op.like]: '%/%'
                },
                project_id: {
                    [Op.gte]: projectId
                }
            },
            order: [['project_id', 'ASC']]
        });
        for (let i = 0; i < projectsList.length; i++) {
            let packageName = projectsList[i].dataValues.package;
            for (let j = 0; j < weekOfMonthList.length; j++) {
                let hasError = await dealDownloadCountBySinglePackage(weekOfMonthList[j].dataValues, packageName);
                if (hasError) {
                    return;
                }
            }
            console.log('getDownloadCountBySinglePackage:project_id:%s,packageName:%s', projectsList[i].dataValues.project_id, packageName);
        }
    }
}

async function dealDownloadCountByMultiPackage(weekOfMonth, packageName, downloadCountList) {
    let downloadCountJson;
    let flag = false;
    try {
        downloadCountJson = await sendRequestGetDownloadCountByPoint(weekOfMonth.start, weekOfMonth.end, packageName);
    } catch (e) {
        console.log(packageName + " sendRequest error!!")
        console.log(e);
        flag = true
    }
    if (flag) {
        return flag
    }
    for (let key in downloadCountJson) {
        if (downloadCountJson.hasOwnProperty(key)) {
            let downloadCount = downloadCountJson[key]
            if (downloadCount == null) {
                continue;
            }
            downloadCountList.push({
                packageName: downloadCountJson.package,
                startDate: downloadCountJson.start,
                endDate: downloadCountJson.end,
                week: weekOfMonth.weekOfMonth,
                downloads: downloadCount.downloads
            });
        }
    }
}

async function dealDownloadCountBySinglePackage(weekOfMonth, packageName) {
    let downloadCountJson;
    let flag = false;
    try {
        downloadCountJson = await sendRequestGetDownloadCountByPoint(weekOfMonth.start, weekOfMonth.end, packageName);
    } catch (e) {
        console.log(packageName + " sendRequest error!!")
        console.log(e);
        flag = true
    }
    if (flag) {
        return flag
    }
    await insertOrUpdateDownloadCount({
        packageName: downloadCountJson.package,
        startDate: downloadCountJson.start,
        endDate: downloadCountJson.end,
        week: weekOfMonth.weekOfMonth,
        downloads: downloadCountJson.downloads
    });
}

export async function sendRequestGetDownloadCountByRange(start, end, name) {
    const response = await fetch(`https://api.npmjs.org/downloads/range/${start}:${end}/${name}`);
    if (response.ok) {
        return response.json();
    }
    return {
        erorr: 'fetch package download count failed'
    }
}

export async function sendRequestGetDownloadCountByPoint(start, end, name) {
    const response = await fetch(`https://api.npmjs.org/downloads/point/${start}:${end}/${name}`);
    if (response.ok) {
        return response.json();
    }
    return {
        erorr: 'fetch package download count failed'
    }
}

export async function insertBatchDownloadCount(downloadCountList) {
    PackageDownloadCountMapper.bulkCreate(downloadCountList).then(downloadCount => {
        console.log('Created DownloadCount:', downloadCount);
    })
        .catch(err => {
            console.error('Error creating DownloadCount:', err);
        });
}

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

export async function insertOrUpdateDownloadCount(downloadCount) {
    PackageDownloadCountMapper.upsert(downloadCount).then(downloadCount => {
        console.log('Created DownloadCount:', downloadCount);
    })
        .catch(err => {
            console.error('Error creating DownloadCount:', err);
        });
}

