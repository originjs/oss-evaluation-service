import sequelize from '@orginjs/oss-evaluation-data-model/util/database.js';

/**
 * getSoftwareMaturity
 *
 * @param packageName packageName
 * @returns softwareMaturity
 */
export async function getSoftwareMaturity(packageName) {
  const sql = `
        select name,
               full_name,
               stargazers_count,
               forks,
               bus_factor,
               openrank,
               score as criticality_score,
               contributor_count
        from github_projects project
           inner join opendigger_info digeer on project.id = digeer.project_id
           inner join criticality_score criticality on project.id = criticality.project_id
           inner join compass_activity_detail_old compass on project.id = compass.project_id
        where full_name = :packageName
  `;
  const downloadSql = `
        select project_name, max(downloads) as downloads
        from project_packages project
                 inner join package_download_count package on project.package = package_name
        where project_name = :packageName
        group by project_name;
  `;

  const softwareMaturity = await sequelize.query(
    sql,
    {
      replacements: { packageName },
      type: sequelize.QueryTypes.SELECT,
    },
  );
  const softwareDownload = await sequelize.query(
    downloadSql,
    {
      replacements: { packageName },
      type: sequelize.QueryTypes.SELECT,
    },
  );
  if (softwareMaturity.length === 0 || softwareDownload.length === 0) {
    return {};
  }
  return {
    name: softwareMaturity[0].name,
    fullName: softwareMaturity[0].full_name,
    downloads: softwareDownload[0].downloads,
    stargazersCount: softwareMaturity[0].stargazers_count,
    forksCount: softwareMaturity[0].forks_count,
    busFactor: softwareMaturity[0].bus_factor,
    openRank: softwareMaturity[0].openrank,
    criticalityScore: softwareMaturity[0].criticality_score,
    contributorCount: softwareMaturity[0].contributor_count,
  };
}

/**
 * getSoftwareCompassActivity
 *
 * @param packageName packageName
 * @returns softwareCompassActivity
 */
export async function getSoftwareCompassActivity(packageName) {
  const sql = `
        select project_id,
               name,
               full_name,
               commit_frequency,
               comment_frequency,
               updated_issues_count,
               closed_issues_count,
               org_count,
               contributor_count,
               grimoire_creation_date
        from github_projects project
                 inner join compass_activity_detail compass on project.id = compass.project_id
        where full_name = :packageName
        order by grimoire_creation_date;
  `;
  const softwareCompassActivity = await sequelize.query(
    sql,
    {
      replacements: { packageName },
      type: sequelize.QueryTypes.SELECT,
    },
  );
  if (softwareCompassActivity.length === 0) {
    return {};
  }
  const commitFrequency = [];
  const commentFrequency = [];
  const updatedIssuesCount = [];
  const closedIssuesCount = [];
  const orgCount = [];
  const contributorCount = [];
  for (const activity of softwareCompassActivity) {
    commitFrequency.push({
      projectId: activity.project_id,
      fullName: activity.full_name,
      number: activity.commit_frequency,
      date: activity.grimoire_creation_date,
    });
    commentFrequency.push({
      projectId: activity.project_id,
      fullName: activity.full_name,
      number: activity.comment_frequency,
      date: activity.grimoire_creation_date,
    });
    updatedIssuesCount.push({
      projectId: activity.project_id,
      fullName: activity.full_name,
      number: activity.updated_issues_count,
      date: activity.grimoire_creation_date,
    });
    closedIssuesCount.push({
      projectId: activity.project_id,
      fullName: activity.full_name,
      number: activity.closed_issues_count,
      date: activity.grimoire_creation_date,
    });
    orgCount.push({
      projectId: activity.project_id,
      fullName: activity.full_name,
      number: activity.org_count,
      date: activity.grimoire_creation_date,
    });
    contributorCount.push({
      projectId: activity.project_id,
      fullName: activity.full_name,
      number: activity.contributor_count,
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
