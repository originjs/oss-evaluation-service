import {
  ProjectPackage,
  PackageSizeDetail,
  Scorecard,
  Benchmark,
  sequelize,
  sequelizeExt,
  ProjectInfo,
  CncfDocumentScoreMin,
  StateOfJsMin,
  SonarCloudProjectMin,
  EvaluationSummary,
  GithubProjects,
  GithubProjectsStargazersTrend,
  PackageDownloadCount,
} from '@orginjs/oss-evaluation-data-model';
import ejsExcel from 'ejsexcel';
import { readFileSync } from 'node:fs';
import { utils, write } from 'xlsx';
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

  const res = softwareInfo.toJSON();
  res.repoName = repoName;
  res.techStack = res.evaluation?.techStack;

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
        ? '--'
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
  and benchmark.raw_value is not null
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

ProjectPackage.hasMany(PackageDownloadCount, { foreignKey: 'package_name', sourceKey: 'package' });
PackageDownloadCount.belongsTo(ProjectPackage, {
  foreignKey: 'package_name',
  targetKey: 'package',
});
/**
 * getSoftwareCompassActivity
 *
 * @param repoName repoName
 * @returns softwareCompassActivity
 */
export async function getSoftwareActivity(repoName: string): Promise<EcologyActivityCategory> {
  const sql = `
        select project_id,
             commit_frequency,
             comment_frequency,
             updated_issues_count,
             closed_issues_count,
             org_count,
             contributor_count,
             recent_releases_count,
             date_format(grimoire_creation_date, '%Y-%m-%d') as grimoire_creation_date
      from github_projects project
               inner join compass_activity_detail compass on project.id = compass.project_id
      where full_name = :repoName
      order by grimoire_creation_date desc
      limit 52
  `;
  let softwareActivity = await sequelize.query(sql, {
    replacements: { repoName },
    type: sequelize.QueryTypes.SELECT,
  });
  if (
    process.env.DATABASE_EXT_URL &&
    sequelizeExt &&
    softwareActivity &&
    softwareActivity.length === 0
  ) {
    const sql = `
        select project_id,
             commit_frequency,
             comment_frequency,
             updated_issues_count,
             closed_issues_count,
             org_count,
             contributor_count,
             recent_releases_count,
             date_format(grimoire_creation_date, '%Y-%m-%d') as grimoire_creation_date
      from compass_activity_detail_substitute
      where full_name = :repoName
      order by grimoire_creation_date desc
      limit 52
  `;
    softwareActivity = await sequelizeExt.query(sql, {
      replacements: { repoName },
      type: sequelize.QueryTypes.SELECT,
    });
  }
  softwareActivity = _.sortBy(softwareActivity, ['grimoire_creation_date']);
  const commitFrequency = [];
  const commentFrequency = [];
  const updatedIssuesCount = [];
  const closedIssuesCount = [];
  const orgCount = [];
  const contributorCount = [];
  const recentReleasesCount = [];
  const packageDownload = [];
  let stargazers = [];
  let date = [];
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
    recentReleasesCount.push({
      projectId: activity.project_id,
      value: activity.recent_releases_count,
      date: activity.grimoire_creation_date,
    });
  }
  const downloadList = await PackageDownloadCount.findAll({
    attributes: ['end_date', 'downloads'],
    include: [
      {
        model: ProjectPackage,
        where: {
          project_name: repoName,
        },
        attributes: [],
      },
    ],
    order: [['end_date', 'desc']],
    limit: 14,
  });
  const sortedDownloadList = _.sortBy(downloadList, item => item.dataValues.end_date);
  for (const download of sortedDownloadList) {
    packageDownload.push({
      value: download.dataValues.downloads,
      date: download.dataValues.end_date,
    });
  }
  const trend = await GithubProjectsStargazersTrend.findAll({
    where: {
      fullName: repoName,
    },
    attributes: ['stargazers', 'date'],
    order: [['date', 'asc']],
  });
  stargazers = _.pluck(trend, 'stargazers');
  date = _.pluck(trend, 'date');

  return {
    packageDownload,
    commitFrequency,
    commentFrequency,
    updatedIssuesCount,
    closedIssuesCount,
    orgCount,
    contributorCount,
    starTrend: {
      stargazers,
      date,
    },
    recentReleasesCount,
  };
}

const DECIMAL_PLACES = 2;

export async function exportScoreExcel(projectName: string) {
  const excelTemplate = readFileSync('./assets/evaluation-template.xlsx');
  const data = await getProjectDetailInfo(projectName);
  const packageName = await getMainPackageByRepoName(projectName);
  const packageSize = await PackageSizeDetail.findOne({
    where: {
      packageName: packageName,
    },
    order: [['version', 'desc']],
    attributes: ['size', 'gzipSize'],
  });
  const resultString = _.reduce(
    data.satisfaction,
    function (acc, item) {
      return acc + `${item.year}: ${item.val}\n`;
    },
    '',
  );
  data.satisfactionExport = resultString.slice(0, resultString.length - 1);
  data.gzipSize = packageSize?.gzipSize;
  data.evaluation.functionScore = Number(fixedRound(data.evaluation.functionScore, DECIMAL_PLACES));
  data.evaluation.qualityScore = Number(fixedRound(data.evaluation.qualityScore, DECIMAL_PLACES));
  data.evaluation.performanceScore = Number(
    fixedRound(data.evaluation.performanceScore, DECIMAL_PLACES),
  );
  data.evaluation.ecologyScore = Number(fixedRound(data.evaluation.ecologyScore, DECIMAL_PLACES));
  data.evaluation.innovationScore = Number(
    fixedRound(data.evaluation.innovationScore, DECIMAL_PLACES),
  );
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
    const workbook = utils.book_new();
    const sheet = utils.json_to_sheet([headers, ...rows], {
      skipHeader: true,
    });
    utils.book_append_sheet(workbook, sheet, 'benchmark');
    return write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } catch (err) {
    Logger.error(err);
  }
}
