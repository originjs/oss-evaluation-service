import {PackageSizeDetail} from '../models/PackageSizeDetail.js';
import {ServerError} from '../util/error.js';
import {GithubProjects} from "../models/GithubProjects.js";
import debug from "debug";
import {ProjectPackages} from "../models/ProjectPackages.js";
import {Op} from 'sequelize'

export async function syncSinglePackageSize(req, res, next) {
    const name = req.body.name
    const version = req.body.version;
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
        url = url + `@${version}&record=true`;
    }
    try {
         const response = await fetch(url);

        if (response.ok) {
            const body = await response.json();
            const gzip = body.gzip;
            const size = body.size;
            const repository = body.repository;
            const dependencyCount = body.dependencyCount;
            const version = body.version;
            const name = body.name;
                return {
                    gzip: gzip,
                    size: size,
                    repository: repository,
                    dependencyCount: dependencyCount,
                    version: version,
                    name : name
                };
        }
    } catch (err) {
        debug.log('fetch fail:', name)
    }

    return {
        erorr: 'fetch package size failed'
    }
}

export async function getGitHubProjectPackageSize(req, res, next) {
    debug.log('packageSize integration startup');
    // Get the package of GitHub project in the database
    GithubProjects.hasOne(ProjectPackages, {foreignKey: 'project_id'})
    let packageNumber =0 ;
    try {
        packageNumber = await GithubProjects.count({
            subQuery: false,
            include: [{
                model: ProjectPackages,
                attributes: ['package'],
                where: {package: {[Op.ne]: null}}
            }]
        });
    } catch (err) {
        debug.log("No packages need to be integrated!", err)
    }

    const Page = 100;
    let begin = 0;
    for (begin; begin < packageNumber; begin += Page) {
        // Get paginated data
        let packageList = await GithubProjects.findAll({
            subQuery: false,
            include: [{
                model: ProjectPackages,
                attributes: ['package'],
                where: {package: {[Op.ne]: null}}
            }],
            attributes: [],
            offset: begin,
            limit: Page,
        });

        let packageSizeList = [];

        for (const item of packageList) {
            if (item.project_package.dataValues.length == 0) {
                continue;
            }
            let packages = item.project_package.dataValues;
            const packageInfo = await getPackageSize(packages.package, null);
            if (packageInfo.erorr) {
                debug.log('package name: ', packages.package, ' there is no data with package size present');
                continue;
            }
            packageSizeList.push(new PackageSizeDetailDto(
                packageInfo.name,
                packageInfo.version,
                packageInfo.gzip,
                packageInfo.size,
                packageInfo.repository,
                packageInfo.dependencyCount
                ));
        }
        // Batch integration
        await insertOrUpdateBatchPackageSize(packageSizeList);
        debug.log('package size insert: data for ', packageList.length, ' projects.')
    }

    res.status(200).data('Data integration completed.');
}


/**
 * Batch insert or update package size data
 *
 * @param packageSizeList Package Size List
 * @returns void
 */
export async function insertOrUpdateBatchPackageSize(packageSizeList) {
    for (let i = 0; i < packageSizeList.length; i++) {
        PackageSizeDetail.upsert(packageSizeList[i]).then(packageSize => {
            console.log('Created packageSize:', packageSizeList[i].package_name);
        })
            .catch(err => {
                console.error('Error creating packageSize:', err);
            });
    }
}

/**
 * packageSize Entity class data
 */
class PackageSizeDetailDto {
    constructor(
        package_name,
        version,
        gzip_size,
        size,
        clone_url,
        dependency_count
    ) {
        this.package_name = package_name;
        this.version = version;
        this.gzip_size = gzip_size;
        this.size = size;
        this.clone_url = clone_url;
        this.dependency_count = dependency_count;
    }
}
