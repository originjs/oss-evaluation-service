import {
  ProjectPackage,
  PackageSizeDetail,
  Scorecard,
  Benchmark,
  sequelize,
  sequelizeExt,
  CncfDocumentScoreMin,
  StateOfJsMin,
  EvaluationSummary,
  ViewProjects,
  GithubProjectsStargazersTrend,
  PackageDownloadCount,
  OssinsightCreatorsOrganizations,
  OssinsightCreatorsCountries,
  ProjectTechStack,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import ejsExcel from 'ejsexcel';
import { readFileSync } from 'node:fs';
import { utils, write } from 'xlsx';
import type {
  BenchmarkData,
  EcologyActivityCategory,
  PerformanceInfo,
  SoftwareInfo,
  InnovationData,
  EcologyActivity,
} from '../interfaces/SoftwareInfo.js';
import { getAlternativeProjects } from './AlternativeProjectService.js';
import { fixedRound } from '../utils/math.js';
import { Op } from 'sequelize';
import _ from 'underscore';
import dayjs from 'dayjs';

ViewProjects.hasOne(Scorecard, { foreignKey: 'p_id', as: 'scorecard' });
ViewProjects.hasOne(EvaluationSummary, { foreignKey: 'p_id', as: 'evaluation' });
ViewProjects.hasMany(StateOfJsMin, { foreignKey: 'p_id', as: 'satisfaction' });
ViewProjects.hasOne(CncfDocumentScoreMin, { foreignKey: 'p_id', as: 'document' });
ViewProjects.hasOne(ProjectTechStack, { foreignKey: 'p_id', as: 'projectTechStack' });

export async function getProjectDetailInfo(repoName: string): Promise<SoftwareInfo> {
  const pId = await getProjectIdByRepoName(repoName);
  const softwareInfo = await ViewProjects.findOne({
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
        model: CncfDocumentScoreMin,
        as: 'document',
      },
      {
        model: StateOfJsMin,
        as: 'satisfaction',
      },
      {
        model: ProjectTechStack,
        as: 'projectTechStack',
      },
    ],
    where: {
      pId,
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
  let packageSize = null;
  if (packageName != null) {
    packageSize = await PackageSizeDetail.findOne({
      where: {
        packageName,
      },
      order: [['version', 'desc']],
      attributes: ['size', 'gzipSize'],
    });
  }

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
  const pId = await getProjectIdByRepoName(repoName);
  const maxPatchIdData = await Benchmark.findOne({
    where: {
      pId,
    },
    limit: 1,
    order: [['patchId', 'desc']],
  });
  if (!maxPatchIdData) {
    return null;
  }

  const benchmarkQuery = `
      select if(benchmark.display_name = '', benchmark.project_name, benchmark.display_name)   as displayName,
             if(index_name.display_name is null, benchmark.benchmark, index_name.display_name) as indexName,
             index_name.category                                                               as indexCategory,
             benchmark.raw_value                                                               as rawValue,
             unit,
             description
      from benchmark
               left join benchmark_index index_name
                         on benchmark.tech_stack = index_name.tech_stack
                             and benchmark.benchmark = index_name.index_name
      where benchmark.p_id = :pId
        and benchmark.patch_id = :patchId
      order by benchmark.display_name, index_name.order`;

  const benchmarkData = await sequelize.query(benchmarkQuery, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      pId,
      patchId: maxPatchIdData.patchId,
    },
  });
  if (!benchmarkData || !benchmarkData.length) {
    return null;
  }
  const map = new Map();
  benchmarkData.forEach(item => {
    const { displayName, indexName, indexCategory, unit, description } = item;
    let { rawValue } = item;
    if (_.isNumber(rawValue)) {
      rawValue = fixedRound(rawValue, 3);
    }
    if (!map.has(displayName)) {
      map.set(displayName, []);
    }
    const data = map.get(displayName);
    data.push({ displayName, indexName, rawValue, indexCategory, unit, description });
  });
  const queryBase = `
      select if(index_name.display_name is null, benchmark.benchmark, index_name.display_name) as indexName,
             category                                                                          as indexCategory,
             min(benchmark.raw_value)                                                          as bestVal
      from benchmark
               left join benchmark_index index_name
                         on benchmark.tech_stack = index_name.tech_stack
                             and benchmark.benchmark = index_name.index_name
      where benchmark.patch_id = :patchId
        and benchmark.raw_value is not null
      group by category, if(index_name.display_name is null, benchmark.benchmark, index_name.display_name)`;
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

export async function getProjectIdByRepoName(repoName: string): Promise<number> {
  const data = await ViewProjects.findOne({
    where: {
      fullName: repoName,
    },
    attributes: ['pId'],
  });
  if (!data) {
    const msg = `cant find repo named {${repoName}}!`;
    logger.info(msg);
    throw new Error(msg);
  }
  return data.pId;
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
    logger.info(msg);
    return null;
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
      select project.p_id,
             commit_frequency,
             comment_frequency,
             updated_issues_count,
             closed_issues_count,
             org_count,
             contributor_count,
             recent_releases_count,
             date_format(grimoire_creation_date, '%Y-%m-%d') as grimoire_creation_date
      from view_projects project
               inner join compass_activity_detail compass on project.p_id = compass.p_id
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
        select p_id,
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

  for (const activity of softwareActivity || []) {
    commitFrequency.push({
      value: fixedRound(activity.commit_frequency, 2),
      date: activity.grimoire_creation_date,
    });
    commentFrequency.push({
      value: fixedRound(activity.comment_frequency, 2),
      date: activity.grimoire_creation_date,
    });
    updatedIssuesCount.push({
      value: activity.updated_issues_count,
      date: activity.grimoire_creation_date,
    });
    closedIssuesCount.push({
      value: activity.closed_issues_count,
      date: activity.grimoire_creation_date,
    });
    orgCount.push({
      value: activity.org_count,
      date: activity.grimoire_creation_date,
    });
    contributorCount.push({
      value: activity.contributor_count,
      date: activity.grimoire_creation_date,
    });
    recentReleasesCount.push({
      value: activity.recent_releases_count,
      date: activity.grimoire_creation_date,
    });
  }

  const results = await Promise.all([
    queryDowloadCount(repoName),
    queryStarsTrend(repoName),
    getAlternativeProjects(repoName),
  ]);
  return {
    packageDownload: results[0],
    commitFrequency,
    commentFrequency,
    updatedIssuesCount,
    closedIssuesCount,
    orgCount,
    contributorCount,
    starTrend: results[1],
    recentReleasesCount,
    alternatives: results[2],
  };
}

async function queryDowloadCount(repoName: string): Promise<EcologyActivity[]> {
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
  return sortedDownloadList.map(item => ({
    value: item.dataValues.downloads,
    date: item.dataValues.end_date,
  }));
}

async function queryStarsTrend(repoName: string) {
  const trend = await GithubProjectsStargazersTrend.findAll({
    where: {
      fullName: repoName,
    },
    attributes: ['stargazers', 'date'],
    order: [['date', 'asc']],
  });
  const stargazers = _.pluck(trend, 'stargazers');
  const date = _.pluck(trend, 'date');
  return {
    stargazers,
    date,
  };
}

export async function getSoftwareInnovate(repoName: string): Promise<InnovationData> {
  const sql = `
      select con.p_id, con.country_code, con.creators_num, con.percentage, con.type
      from ossinsight_creators_countries con
               left join view_projects git on git.p_id = con.p_id
      where git.full_name = :repoName
      order by creators_num desc;
  `;
  const softwareInnovate = await sequelize.query(sql, {
    replacements: { repoName },
    type: sequelize.QueryTypes.SELECT,
  });
  let prCountriesRaw = [];
  let starCountriesRaw = [];
  let issueCountriesRaw = [];

  if (softwareInnovate?.length !== 0) {
    const prCountries = softwareInnovate
      .filter(item => item.type === 0)
      .filter(item => item.country_code !== 'UNKNOWN')
      .sort((a, b) => {
        return b.creators_num - a.creators_num;
      });
    prCountriesRaw = prCountries?.slice(0, 100).map(item => ({
      countryCode: item.country_code,
      creatorsNum: item.creators_num,
      percentage: item.percentage,
    }));

    const issueCountries = softwareInnovate
      .filter(item => item.type === 2)
      .filter(item => item.country_code !== 'UNKNOWN')
      .sort((a, b) => {
        return b.creators_num - a.creators_num;
      });
    issueCountriesRaw = issueCountries?.slice(0, 100).map(item => ({
      countryCode: item.country_code,
      creatorsNum: item.creators_num,
      percentage: item.percentage,
    }));
    const starCountries = softwareInnovate
      .filter(item => item.type === 1)
      .filter(item => item.country_code !== 'UNKNOWN')
      .sort((a, b) => {
        return b.creators_num - a.creators_num;
      });
    starCountriesRaw = starCountries?.slice(0, 100).map(item => ({
      countryCode: item.country_code,
      creatorsNum: item.creators_num,
      percentage: item.percentage,
    }));
  }

  return {
    prCountries: prCountriesRaw,
    issueCountries: issueCountriesRaw,
    starCountries: starCountriesRaw,
  };
}

export async function prCreatorCompanyAndAreaInfo(repoName: string) {
  const pId = await getProjectIdByRepoName(repoName);
  const orgSummaryInfo = await OssinsightCreatorsOrganizations.findAll({
    where: {
      pId,
      type: 0,
      org_name: {
        [Op.notIn]: ['.', '...', '-', 'none', 'null', 'no', 'china', 'China', 'undefined'],
      },
    },
    attributes: [
      // Why don't we use `underscored: true`?
      ['p_id', 'pId'],
      ['org_name', 'orgName'],
      ['creators_num', 'creatorsNum'],
      'percentage',
    ],
    limit: 10,
    order: [['percentage', 'desc']],
  });

  const countrySummaryInfo = await OssinsightCreatorsCountries.findAll({
    where: {
      pId,
      type: 0,
      country_code: {
        [Op.ne]: 'UNKNOWN',
      },
    },
    attributes: [
      ['p_id', 'pId'],
      ['country_code', 'countryCode'],
      ['creators_num', 'creatorsNum'],
      'percentage',
    ],
    limit: 10,
    order: [['percentage', 'desc']],
  });
  return { orgSummaryInfo, countrySummaryInfo };
}

export async function allHealthScore(repoName: string) {
  let score = await EvaluationSummary.findOne({
    where: {
      projectName: repoName,
    },
    attributes: [
      'projectName',
      'functionScore',
      'performanceScore',
      'qualityScore',
      'ecologyScore',
      'innovationScore',
      'scorecardScore',
    ],
  });
  score = score?.dataValues;
  if (!score) {
    return {};
  }
  for (const key in score) {
    if (key.endsWith('Score') && score[key]) {
      score[key] = fixedRound(score[key], 2);
    }
  }
  return score;
}

async function queryExportSoftwareInfo(projectName: string) {
  const data = await getProjectDetailInfo(projectName);
  const packageName = await getMainPackageByRepoName(projectName);
  let packageSize = null;
  if (packageName != null) {
    packageSize = await PackageSizeDetail.findOne({
      where: {
        packageName: packageName,
      },
      order: [['version', 'desc']],
      attributes: ['size', 'gzipSize'],
    });
  }
  const resultString = _.reduce(
    data.satisfaction,
    function (acc, item) {
      return acc + `${item.year}: ${item.val}\n`;
    },
    '',
  );
  const DECIMAL_PLACES = 2;
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
  return data;
}

export async function compareExportScoreExcel(projectNameList: string[]) {
  const excelTemplate = readFileSync('./assets/evaluation-compare-template.xlsx');
  const resMap: Map<string, any> = new Map();
  for (const projectName of projectNameList) {
    const data = await queryExportSoftwareInfo(projectName);
    for (const key in data) {
      if (!resMap.get(key)) {
        resMap.set(key, []);
      }
      resMap.get(key).push(data[key]);
    }
  }
  if (!resMap) {
    return;
  }
  const res = Object.fromEntries(resMap);
  await exportFieldSupplement(res);
  try {
    return ejsExcel.renderExcel(excelTemplate, res);
  } catch (err) {
    logger.error(err);
  }
}

async function exportFieldSupplement(data: any) {
  const packageJson = readFileSync('../api-server/package.json', 'utf-8');
  const packageInfo = JSON.parse(packageJson);
  data.title = `先进性评估报告 v${packageInfo.version} 评估时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;
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
    logger.error(err);
  }
}

export async function getInnovation(repoName: string) {
  const dependentProjectSql = `
      select pd.full_name       as fullName,
             pd.owner_name      as ownerName,
             pd.owner_type      as ownerType,
             p.stargazers_count as star
      from github_projects_dependencies pd
               inner join view_projects p on p.p_id = pd.p_id
      where dependent_full_name = :repoName
        and pd.full_name != :repoName
        and pd.deleted = false
      order by stargazers_count desc
      limit 50`;

  const dependentProject = await sequelize.query(dependentProjectSql, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      repoName,
    },
  });

  const dependentOrganizationSql = `
      select pd.owner_name as ownerName, p.stargazers_count as star
      from github_projects_dependencies pd
               inner join view_projects p on p.p_id = pd.p_id
      where dependent_full_name = :repoName
        and pd.full_name != :repoName
        and pd.owner_type = 'Organization'
        and pd.deleted = false
      order by stargazers_count desc
      limit 50;
  `;
  const dependentOrganization = await sequelize.query(dependentOrganizationSql, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      repoName,
    },
  });

  const companiesSql = `
      select ocr.p_id         as pId,
             ocr.org_name     as orgName,
             ocr.creators_num as creatorsNum,
             ocr.percentage   as percentage,
             ocr.type
      from ossinsight_creators_organizations ocr
               inner join view_projects p on p.p_id = ocr.p_id
      where p.full_name = :repoName
      order by ocr.percentage desc;
  `;

  const filterCharacter = ['.', '...', '-', 'none', 'null', 'no', 'china', 'China', 'undefined'];

  let companiesData = await sequelize.query(companiesSql, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      repoName,
    },
  });
  companiesData = companiesData.filter(obj => !filterCharacter.includes(obj.orgName));

  const prCreators = companiesData
    .filter(item => item.type === 0)
    .slice(0, 50)
    .map(obj => ({
      ...obj,
      percentage: (obj.percentage * 100).toFixed(2) + '%',
    }));
  const stargazers = companiesData
    .filter(item => item.type === 1)
    .slice(0, 50)
    .map(obj => ({
      ...obj,
      percentage: (obj.percentage * 100).toFixed(2) + '%',
    }));
  const issueCreators = companiesData
    .filter(item => item.type === 2)
    .slice(0, 50)
    .map(obj => ({
      ...obj,
      percentage: (obj.percentage * 100).toFixed(2) + '%',
    }));

  return {
    organizationInfo: {
      dependentProject,
      dependentOrganization,
    },
    companiesInfo: {
      stargazers,
      issueCreators,
      prCreators,
    },
  };
}

export async function getSummaryHighlightInfo(repoName: string) {
  const COMPANIES_SIZE = 6;
  const alternativeProjects = await getAlternativeProjects(repoName);

  const topPrCompaniesSql = `
      select ocr.p_id         as pId,
             ocr.org_name     as orgName,
             ocr.creators_num as creatorsNum,
             ocr.percentage   as percentage
      from ossinsight_creators_organizations ocr
               inner join view_projects p on p.p_id = ocr.p_id
      where p.full_name = :repoName
        and ocr.type = 0
      order by ocr.percentage desc
      limit 20
  `;
  const filterCharacter = ['.', '...', '-', 'none', 'null', 'no', 'china'];

  let topPrCompanies = await sequelize.query(topPrCompaniesSql, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      repoName,
    },
  });
  topPrCompanies = topPrCompanies
    .filter((obj: { orgName: string }) => !filterCharacter.includes(obj.orgName))
    .slice(0, COMPANIES_SIZE);


  return {
    alternativeProjects,
    topPrCompanies,

  };
}
