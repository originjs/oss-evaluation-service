import { PackageDownloadCount, ProjectPackage } from '@orginjs/oss-evaluation-data-model';
import sequelize from '../util/database.js';

export async function refreshMainPackage(req, res) {
  const { week } = await PackageDownloadCount.findOne({
    order: [['week', 'desc']],
    offset: 1,
    limit: 1,
  });

  // get the most downloaded packages for each project
  const maxDownloadSql = `select package, downloads, project_name as projectName, rank_num
               from (select package,
                            downloads,
                            project_name,
                            row_number() over (partition by project_name order by downloads desc) rank_num
                     from project_packages packages
                              join package_download_count download
                                   on packages.package = download.package_name
                                       and week = '${week}') temp
               where rank_num = 1`;

  const maxDownloadPackage = await sequelize.query(maxDownloadSql, {
    type: sequelize.QueryTypes.SELECT,
  });

  //   find no main package projects
  const findNoMainPackageSql = `
        select project_name as projectName
          from project_packages
      group by project_name
      having count((main_package_fresh_type = 'manual' and main_package = 1) or null) = 0
  `;
  const noMainPackageProjects = await sequelize.query(findNoMainPackageSql, {
    type: sequelize.QueryTypes.SELECT,
  });

  const map = new Map();
  maxDownloadPackage.forEach(item => {
    map.set(item.projectName, item.package);
  });

  // update each project`s main package
  for (const { projectName } of noMainPackageProjects) {
    const mainPackage = map.get(projectName);
    if (!mainPackage) {
      continue;
    }
    await ProjectPackage.update(
      {
        main_package: true,
        main_package_fresh_type: 'auto',
      },
      {
        where: {
          projectName,
          package: mainPackage,
        },
      },
    );
  }
  res.status(200).json('{success}');
}
