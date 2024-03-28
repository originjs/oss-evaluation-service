import {
  ProjectPackage,
  GithubProjects,
  StateOfJs,
  CncfDocumentScore,
  PackageSizeDetail,
  Scorecard,
  EvaluationSummary,
  Benchmark,
  sequelize,
  ProjectInfo,
  EvaluationMin,
  SonarCloudProject,
  CncfDocumentScoreMin,
  StateOfJsMin,
  ProjectTechStack,
  SonarCloudProjectMin,
} from '@orginjs/oss-evaluation-data-model';
import ChartData from '../model/chartData.js';
import { round } from '../util/math.js';
import { Op } from 'sequelize';
import { getSoftwareEcologyOverview } from './softwareEcology.js';

ProjectInfo.hasOne(Scorecard, { foreignKey: 'project_id', as: 'scorecard' });
ProjectInfo.hasOne(SonarCloudProjectMin, { foreignKey: 'github_project_id', as: 'sonarCloudScan' });
ProjectInfo.hasOne(EvaluationMin, { foreignKey: 'project_id', as: 'evaluation' });
ProjectInfo.hasMany(StateOfJsMin, { foreignKey: 'project_id', as: 'satisfaction' });
ProjectInfo.hasOne(CncfDocumentScoreMin, { foreignKey: 'project_id', as: 'document' });
ProjectInfo.hasOne(ProjectTechStack, { foreignKey: 'project_id', as: 'techStack' });

export async function getSoftwareInfo(repoName) {
  const projectId = await getProjectIdByRepoName(repoName);
  const softwareInfo = await ProjectInfo.findOne({
    include: [
      {
        model: EvaluationMin,
        as: 'evaluation',
      },
      {
        model: Scorecard,
        as: 'scorecard',
      },
      {
        model: SonarCloudProjectMin,
        as: 'sonarCloudScan',
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
        as: 'techStack',
      },
    ],
    where: {
      id: projectId,
    },
  });

  const res = softwareInfo.toJSON();
  const ecologyOverview = await getSoftwareEcologyOverview(repoName);
  res.repoName = repoName;
  res.ecologyOverview = ecologyOverview;
  res.techStack = res.techStack?.subcategory;
  res.codeLines = (res.codeLines / 1000).toFixed(2);
  res.evaluation.functionScore = res.evaluation.functionScore?.toFixed(2);
  res.evaluation.qualityScore = res.evaluation.qualityScore?.toFixed(2);
  res.evaluation.performanceScore = res.evaluation.performanceScore?.toFixed(2);
  res.evaluation.ecologyScore = res.evaluation.ecologyScore?.toFixed(2);
  res.evaluation.scorecardScore = res.evaluation.scorecardScore?.toFixed(2);
  res.evaluation.criticalityScore = res.evaluation.criticalityScore?.toFixed(2);
  res.evaluation.openrank = res.evaluation.openrank?.toFixed(2);
  res.document.documentScore = res.document.documentScore?.toFixed(2);

  if (res.satisfaction?.length !== 0) {
    let satisfaction = res.satisfaction.sort((a, b) => {
      return b.year - a.year;
    });
    res.satisfaction = satisfaction?.slice(0, 3).map(item => ({
      year: item.year,
      val: item.satisfactionPercentage,
    }));
  }

  return res;
}

export async function getSoftwareFunction(repoName) {
  const projectId = await getProjectIdByRepoName(repoName);
  const stateOfJsData = await StateOfJs.findAll({
    where: {
      projectId,
    },
    order: [['year', 'asc']],
  });
  const res = {};
  // TODO github star trends
  res.starTrend = new ChartData([], []);
  // developer satisfaction
  if (stateOfJsData?.length !== 0) {
    const x = [];
    const y = [];
    stateOfJsData.forEach(item => {
      x.push(item.year);
      y.push(item.satisfactionPercentage);
    });
    res.satisfaction = new ChartData(x, y);
  }

  // documentation best practices
  const { documentScore, hasReadme, hasChangelog, hasWebsite, hasContributing } =
    (await CncfDocumentScore.findOne({
      where: {
        projectId,
      },
      attributes: ['documentScore', 'hasReadme', 'hasChangelog', 'hasWebsite', 'hasContributing'],
    })) || {};
  res.document = {
    documentScore: round(documentScore, 0),
    hasReadme,
    hasChangelog,
    hasWebsite,
    hasContributing,
  };
  return res;
}

/**
 * get software overview
 * @param repoName repoName
 * @return {Promise<{codeLines: number, evaluation: *,
 * firstCommit, license: *, star: *, description, language: *, tags: *}>}
 */
export async function getSoftwareOverview(repoName) {
  const projectId = await getProjectIdByRepoName(repoName);
  //   get star num
  const githubInfo = await GithubProjects.findOne({
    where: {
      id: projectId,
    },
  });

  const evaluation = await EvaluationSummary.findOne({
    where: {
      projectId,
    },
    order: [['evaluateTime', 'desc']],
    attributes: [
      'functionScore',
      'qualityScore',
      'performanceScore',
      'ecologyScore',
      'innovationValue',
    ],
  });

  const techStack = await ProjectTechStack.findOne({
    where: {
      projectId,
    },
    attributes: ['subcategory'],
  });
  evaluation.functionScore = Math.round(evaluation.functionScore * 100) / 100;
  evaluation.qualityScore = Math.round(evaluation.qualityScore * 100) / 100;
  evaluation.performanceScore = Math.round(evaluation.performanceScore * 100) / 100;
  evaluation.ecologyScore = Math.round(evaluation.ecologyScore * 100) / 100;
  evaluation.innovationValue = Math.round(evaluation.innovationValue * 100) / 100;

  return {
    url: githubInfo.htmlUrl,
    logo: githubInfo.ownerAvatarUrl,
    star: githubInfo.stargazersCount,
    fork: githubInfo.forksCount,
    language: githubInfo.language,
    firstCommit: githubInfo.createdAt,
    license: githubInfo.licenseName,
    description: githubInfo.description,
    tags: githubInfo.topics,
    codeLines: githubInfo.codeSize ? (githubInfo.codeSize / 1000).toFixed(2) : 0,
    techStack: techStack?.subcategory,
    evaluation,
  };
}

export async function getPerformance(repoName) {
  const packageName = await getMainPackageByRepoName(repoName);
  const packageSize = await PackageSizeDetail.findOne({
    where: {
      packageName,
    },
    order: [['version', 'desc']],
    attributes: ['size', 'gzipSize'],
  });

  // benchmark
  let benchmarkData = await getPerformanceBenchmark(repoName);
  return {
    size: packageSize?.size,
    gzipSize: packageSize?.gzipSize,
    //   TODO benchmark score
    benchmarkScore: 0,
    benchmarkData,
  };
}

export async function getPerformanceBenchmark(repoName) {
  const projectId = await getProjectIdByRepoName(repoName);
  const maxPatchIdData = await Benchmark.findOne({
    where: {
      projectId,
    },
    limit: 1,
    order: [['patchId', 'desc']],
  });
  if (!maxPatchIdData) {
    return;
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
    return;
  }
  const map = new Map();
  benchmarkData.forEach(item => {
    // fill unit(ms,kb..)
    item.rawValue = !item.rawValue || item.rawValue === -1 ? null : `${item.rawValue} ${item.unit}`;
    const { displayName, indexName, rawValue } = item;
    if (!map.has(displayName)) {
      map.set(displayName, []);
    }
    const data = map.get(displayName);
    data.push({ displayName, indexName, rawValue });
  });
  return [...map.values()];
}

export async function getQuality(repoName) {
  const projectId = await getProjectIdByRepoName(repoName);
  const res = {};
  const scorecard = await Scorecard.findOne({
    where: {
      projectId,
    },
    order: [['updatedAt', 'desc']],
  });
  res.scorecard = scorecard || {};
  const sonarCloud = await SonarCloudProject.findOne({
    where: {
      githubProjectId: projectId,
      analysisDate: {
        [Op.ne]: null,
      },
    },
    attributes: [
      'bugs',
      'reliabilityRating',
      'codeSmells',
      'maintainabilityRating',
      'securityRating',
      'vulnerabilities',
      'securityHotspots',
      'securityHotspotsReviewed',
      'securityReviewRating',
    ],
  });
  res.sonar = sonarCloud || {};
  return res;
}

async function getProjectIdByRepoName(repoName) {
  const data = await ProjectPackage.findOne({
    where: {
      projectName: repoName,
    },
    attributes: ['projectId'],
  });
  if (!data) {
    const msg = `cant find repo named {${repoName}}!`;
    console.warn(msg);
    throw new Error(msg);
  }
  return data.projectId;
}

/**
 * get main package of project
 * @param repoName projectName
 * @return {Promise<string>} packageName
 */
export async function getMainPackageByRepoName(repoName) {
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
