import sequelize from '@orginjs/oss-evaluation-data-model/util/database.js';
import ejsExcel from 'ejsexcel';
import debug from 'debug';
import EvaluationSummary from '@orginjs/oss-evaluation-data-model/models/EvaluationSummary.js';
import { PackageDownloadCount } from '@orginjs/oss-evaluation-data-model';
import { getMainPackageByRepoName, getPerformanceBenchmark } from './softwareDetailService.js';
import { readFileSync } from 'node:fs';
import XLSX from 'xlsx';
import { fixedRound } from '../util/math.js';

/**
 * getSoftwareEcologyOverview
 *
 * @param repoName repoName
 * @returns softwareEcologyOverview
 */
export async function getSoftwareEcologyOverview(repoName) {
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

  const packageName = await getMainPackageByRepoName(repoName);
  const softwareEcologyOverview = await sequelize.query(sql, {
    replacements: { packageName: repoName },
    type: sequelize.QueryTypes.SELECT,
  });
  const downloadData = await PackageDownloadCount.findOne({
    where: {
      packageName,
    },
    attributes: ['downloads'],
    order: [['week', 'desc']],
  });
  if (softwareEcologyOverview.length === 0 || !downloadData) {
    return {};
  }
  return {
    name: softwareEcologyOverview[0].name,
    fullName: softwareEcologyOverview[0].full_name,
    downloads: downloadData.downloads,
    stargazersCount: softwareEcologyOverview[0].stargazers_count,
    forksCount: softwareEcologyOverview[0].forks_count,
    busFactor: softwareEcologyOverview[0].bus_factor,
    openRank: fixedRound(softwareEcologyOverview[0].openrank, 2),
    criticalityScore: fixedRound(softwareEcologyOverview[0].criticality_score, 2),
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
      value: fixedRound(activity.commit_frequency, 2),
      date: activity.grimoire_creation_date,
    });
    commentFrequency.push({
      projectId: activity.project_id,
      value: fixedRound(activity.comment_frequency, 2),
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

export async function exportScoreExcel(packageName) {
  const excelTemplate = readFileSync('./excel/evaluation-template.xlsx');
  const data = await EvaluationSummary.findOne({
    where: {
      project_name: packageName,
    },
  });
  if (!data) {
    return;
  }
  try {
    return ejsExcel.renderExcel(excelTemplate, data);
  } catch (err) {
    debug.log(err);
  }
}

export async function exportBenchmarkExcel(repoName) {
  let benchmarkData = await getPerformanceBenchmark(repoName);
  if (!benchmarkData) {
    return;
  }
  const headers = [];
  // empty first cell
  headers.push('');
  benchmarkData.forEach(item => {
    headers.push(item[0].displayName);
  });
  const map = new Map();
  benchmarkData.flat().forEach(({ indexName, rawValue }) => {
    if (!map.has(indexName)) {
      map.set(indexName, []);
    }
    const value = map.get(indexName);
    value.push(rawValue);
  });
  const rows = [];
  for (let [k, v] of map.entries()) {
    const row = [];
    row.push(k, ...v);
    rows.push(row);
  }
  try {
    const workbook = XLSX.utils.book_new();
    let sheet = XLSX.utils.json_to_sheet([headers, ...rows], {
      skipHeader: true,
    });
    XLSX.utils.book_append_sheet(workbook, sheet, 'benchmark');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (err) {
    debug.log(err);
  }
}
