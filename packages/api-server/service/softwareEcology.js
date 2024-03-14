import sequelize from '@orginjs/oss-evaluation-data-model/util/database.js';
import ejsExcel from 'ejsexcel';
import fs from 'fs';
import debug from 'debug';
import EvaluationSummary from '@orginjs/oss-evaluation-data-model/models/EvaluationSummary.js';

/**
 * getSoftwareEcologyOverview
 *
 * @param packageName packageName
 * @returns softwareEcologyOverview
 */
export async function getSoftwareEcologyOverview(packageName) {
  const sql = `
        select project.id,
               name,
               full_name,
               stargazers_count,
               forks_count,
               bus_factor,
               openrank,
               score as criticality_score,
               max(contributor_count) as contributor_count
        from github_projects project
           inner join opendigger_info digeer on project.id = digeer.project_id
           inner join criticality_score criticality on project.id = criticality.project_id
           inner join compass_activity_detail compass on project.id = compass.project_id
        where full_name = :packageName
        group by project.id;
  `;
  const downloadSql = `
        select project_name, max(downloads) as downloads
        from project_packages project
                 inner join package_download_count package on project.package = package_name
        where project_name = :packageName
        group by project_name;
  `;

  const softwareEcologyOverview = await sequelize.query(sql, {
    replacements: { packageName },
    type: sequelize.QueryTypes.SELECT,
  });
  const softwareDownload = await sequelize.query(downloadSql, {
    replacements: { packageName },
    type: sequelize.QueryTypes.SELECT,
  });
  if (softwareEcologyOverview.length === 0 || softwareDownload.length === 0) {
    return {};
  }
  return {
    name: softwareEcologyOverview[0].name,
    fullName: softwareEcologyOverview[0].full_name,
    downloads: softwareDownload[0].downloads,
    stargazersCount: softwareEcologyOverview[0].stargazers_count,
    forksCount: softwareEcologyOverview[0].forks_count,
    busFactor: softwareEcologyOverview[0].bus_factor,
    openRank: softwareEcologyOverview[0].openrank,
    criticalityScore: softwareEcologyOverview[0].criticality_score,
    contributorCount: softwareEcologyOverview[0].contributor_count,
    dependentCount: 0,
  };
}

/**
 * getSoftwareCompassActivity
 *
 * @param packageName packageName
 * @returns softwareCompassActivity
 */
export async function getSoftwareActivity(packageName) {
  const sql = `
        select project_id,
               name,
               commit_frequency,
               comment_frequency,
               updated_issues_count,
               closed_issues_count,
               org_count,
               contributor_count,
               date_format(grimoire_creation_date, '%Y-%m-%d') as grimoire_creation_date
        from github_projects project
                 inner join compass_activity_detail compass on project.id = compass.project_id
        where full_name = :packageName
            and grimoire_creation_date between DATE_SUB(CURDATE(), INTERVAL 3 MONTH) and CURDATE()
        order by grimoire_creation_date;
  `;
  const softwareActivity = await sequelize.query(sql, {
    replacements: { packageName },
    type: sequelize.QueryTypes.SELECT,
  });
  if (softwareActivity.length === 0) {
    return {};
  }
  const commitFrequency = [];
  const commentFrequency = [];
  const updatedIssuesCount = [];
  const closedIssuesCount = [];
  const orgCount = [];
  const contributorCount = [];
  for (const activity of softwareActivity) {
    commitFrequency.push({
      projectId: activity.project_id,
      value: activity.commit_frequency,
      date: activity.grimoire_creation_date,
    });
    commentFrequency.push({
      projectId: activity.project_id,
      value: activity.comment_frequency,
      date: activity.grimoire_creation_date,
    });
    updatedIssuesCount.push({
      projectId: activity.project_id,
      value: activity.updated_issues_count,
      date: activity.grimoire_creation_date,
    });
    closedIssuesCount.push({
      projectId: activity.project_id,
      value: activity.closed_issues_count,
      date: activity.grimoire_creation_date,
    });
    orgCount.push({
      projectId: activity.project_id,
      value: activity.org_count,
      date: activity.grimoire_creation_date,
    });
    contributorCount.push({
      projectId: activity.project_id,
      value: activity.contributor_count,
      date: activity.grimoire_creation_date,
    });
  }
  return {
    commitFrequency,
    commentFrequency,
    updatedIssuesCount,
    closedIssuesCount,
    orgCount,
    contributorCount,
  };
}

export async function exportExcel(packageName) {
  const exlBuf = fs.readFileSync('./excel/evaluation-template.xlsx');
  let path = `${Date.now()}.xlsx`;
  const data = await EvaluationSummary.findOne({
    where: {
      project_name: packageName,
    },
  });
  if (data === undefined || data === null) {
    return '';
  }
  await ejsExcel
    .renderExcel(exlBuf, data)
    .then((exlBuf2) => {
      path = `./excel/download/${path}`;
      fs.writeFileSync(path, exlBuf2);
    })
    .catch((err) => {
      debug.log(err);
    });
  return path;
}
