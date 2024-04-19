import {
  ProjectPackage,
  PackageSizeDetail,
  Scorecard,
  Benchmark,
  sequelize,
  ProjectInfo,
  CncfDocumentScoreMin,
  StateOfJsMin,
  SonarCloudProjectMin,
  EvaluationSummary,
  GithubProjects,
  GithubProjectsStargazersTrend,
} from '@orginjs/oss-evaluation-data-model';
import ejsExcel from 'ejsexcel';
import { readFileSync } from 'node:fs';
import XLSX from 'xlsx';
import type {
  BenchmarkData,
  EcologyActivityCategory,
  PerformanceInfo,
  SoftwareInfo,
} from '../interfaces/SoftwareInfo.js';
import { fixedRound } from '../utils/math.js';
import Logger from '../utils/logger.js';
import { Op } from 'sequelize';
import _ from 'underscore';

ProjectInfo.hasOne(Scorecard, { foreignKey: 'project_id', as: 'scorecard' });
ProjectInfo.hasOne(SonarCloudProjectMin, { foreignKey: 'github_project_id', as: 'sonarCloudScan' });
ProjectInfo.hasOne(EvaluationSummary, { foreignKey: 'project_id', as: 'evaluation' });
ProjectInfo.hasMany(StateOfJsMin, { foreignKey: 'project_id', as: 'satisfaction' });
ProjectInfo.hasOne(CncfDocumentScoreMin, { foreignKey: 'project_id', as: 'document' });

export async function getProjectDetailInfo(repoName: string): Promise<SoftwareInfo> {
  const projectId = await getProjectIdByRepoName(repoName);
  const softwareInfo = await ProjectInfo.findOne({
    include: [
      {
        model: EvaluationSummary,
        as: 'evaluation',
      },
      {
        model: Scorecard,
        as: 'scorecard',
      },
      {
        model: SonarCloudProjectMin,
        as: 'sonarCloudScan',
        required: false,
        where: {
          analysisDate: {
            [Op.ne]: null,
          },
        },
      },
      {
        model: CncfDocumentScoreMin,
        as: 'document',
      },
      {
        model: StateOfJsMin,
        as: 'satisfaction',
      },
    ],
    where: {
      id: projectId,
    },
  });
  const trend = await GithubProjectsStargazersTrend.findAll({
    where: {
      fullName: repoName,
    },
    attributes: ['stargazers', 'date',],
    order: [['date', 'asc']],
  });
  const stargazers = _.pluck(trend, 'stargazers');
  const date = _.pluck(trend, 'date');

  const res = softwareInfo.toJSON();
  res.repoName = repoName;
  res.techStack = res.evaluation?.techStack;
  res.starTrend = {
    stargazers,
    date,
  };

  if (res.satisfaction?.length !== 0) {
    const satisfaction = res.satisfaction.sort((a, b) => {
      return a.year - b.year;
    });
    res.satisfaction = satisfaction?.map(item => ({
      year: item.year,
      val: item.satisfactionPercentage,
    }));
  }

  return res;
}

export async function getPerformance(repoName: string): Promise<PerformanceInfo> {
  const packageName = await getMainPackageByRepoName(repoName);
  const packageSize = await PackageSizeDetail.findOne({
    where: {
      packageName,
    },
    order: [['version', 'desc']],
    attributes: ['size', 'gzipSize'],
  });

  // benchmark
  const benchmarkData = await getPerformanceBenchmark(repoName);
  return {
    size: packageSize?.size,
    packageName,
    gzipSize: packageSize?.gzipSize,
    //   TODO benchmark score
    benchmarkScore: 0,
    benchmarkData,
  };
}

export async function getPerformanceBenchmark(repoName: string): Promise<BenchmarkData | null> {
  const projectId = await getProjectIdByRepoName(repoName);
  const maxPatchIdData = await Benchmark.findOne({
    where: {
      projectId,
    },
    limit: 1,
    order: [['patchId', 'desc']],
  });
  if (!maxPatchIdData) {
    return null;
  }

  const benchmarkQuery = `
  select if(benchmark.display_name = '',benchmark.project_name,benchmark.display_name) as displayName,
    if(index_name.display_name is null, benchmark.benchmark, index_name.display_name) as indexName,
       benchmark.raw_value as rawValue,
       unit
from benchmark
       left join benchmark_index index_name
              on benchmark.tech_stack = index_name.tech_stack
                  and benchmark.benchmark = index_name.index_name
where benchmark.project_id = :projectId
      and benchmark.patch_id = :patchId
order by benchmark.display_name, index_name.order`;

  const benchmarkData = await sequelize.query(benchmarkQuery, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      projectId,
      patchId: maxPatchIdData.patchId,
    },
  });
  if (!benchmarkData || !benchmarkData.length) {
    return null;
  }
  const map = new Map();
  benchmarkData.forEach(item => {
    // fill unit(ms,kb..)
    item.rawValue =
      !item.rawValue || item.rawValue === -1
        ? null
        : item.unit
          ? `${fixedRound(item.rawValue, 2)} ${item.unit}`
          : `${fixedRound(item.rawValue, 2)}`;
    const { displayName, indexName, rawValue } = item;
    if (!map.has(displayName)) {
      map.set(displayName, []);
    }
    const data = map.get(displayName);
    data.push({ displayName, indexName, rawValue });
  });
  const queryBase = `
  select if(index_name.display_name is null, benchmark.benchmark, index_name.display_name) as indexName,
       min(benchmark.raw_value)                                                          as bestVal
from benchmark
         left join benchmark_index index_name
                   on benchmark.tech_stack = index_name.tech_stack
                       and benchmark.benchmark = index_name.index_name
where benchmark.patch_id = :patchId
  and benchmark.raw_value > 0
group by if(index_name.display_name is null, benchmark.benchmark, index_name.display_name)`;
  const bestVal = await sequelize.query(queryBase, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      patchId: maxPatchIdData.patchId,
    },
  });
  return {
    data: [...map.values()],
    base: bestVal,
  };
}

export async function getProjectIdByRepoName(repoName: string) {
  const data = await GithubProjects.findOne({
    where: {
      fullName: repoName,
    },
    attributes: ['id'],
  });
  if (!data) {
    const msg = `cant find repo named {${repoName}}!`;
    console.warn(msg);
    throw new Error(msg);
  }
  return data.id;
}

/**
 * get main package of project
 * @param repoName projectName
 * @return {Promise<string>} packageName
 */
export async function getMainPackageByRepoName(repoName: string) {
  const data = await ProjectPackage.findOne({
    where: {
      mainPackage: true,
      projectName: repoName,
    },
    attributes: ['package'],
  });
  if (!data) {
    const msg = `cant find main package of project:{${repoName}}!`;
    console.warn(msg);
    throw new Error(msg);
  }
  return data.package;
}

/**
 * getSoftwareCompassActivity
 *
 * @param repoName repoName
 * @returns softwareCompassActivity
 */
export async function getSoftwareActivity(repoName: string): Promise<EcologyActivityCategory> {
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
        where full_name = :repoName
            and grimoire_creation_date between DATE_SUB(CURDATE(), INTERVAL 3 MONTH) and CURDATE()
        order by grimoire_creation_date;
  `;
  const softwareActivity = await sequelize.query(sql, {
    replacements: { repoName },
    type: sequelize.QueryTypes.SELECT,
  });
  const commitFrequency = [];
  const commentFrequency = [];
  const updatedIssuesCount = [];
  const closedIssuesCount = [];
  const orgCount = [];
  const contributorCount = [];
  for (const activity of softwareActivity || []) {
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

export async function exportScoreExcel(packageName: string) {
  const excelTemplate = readFileSync('assets/evaluation-template.xlsx');
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
    Logger.error(err);
  }
}

export async function exportBenchmarkExcel(repoName: string) {
  const benchmarkDataAndBase = await getPerformanceBenchmark(repoName);
  const data = benchmarkDataAndBase?.data;
  if (!data) {
    return;
  }
  const headers = [];
  // empty first cell
  headers.push('');
  data.forEach(item => {
    headers.push(item[0].displayName);
  });
  const map = new Map();
  data.flat().forEach(({ indexName, rawValue }) => {
    if (!map.has(indexName)) {
      map.set(indexName, []);
    }
    const value = map.get(indexName);
    value.push(rawValue);
  });
  const rows = [];
  for (const [k, v] of map.entries()) {
    const row = [];
    row.push(k, ...v);
    rows.push(row);
  }
  try {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([headers, ...rows], {
      skipHeader: true,
    });
    XLSX.utils.book_append_sheet(workbook, sheet, 'benchmark');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (err) {
    Logger.error(err);
  }
}
