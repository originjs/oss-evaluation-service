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
} from '@orginjs/oss-evaluation-data-model';
import ChartData from '../model/chartData.js';
import { round } from '../util/math.js';

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
    codeLines: Number.NaN,
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
    size: packageSize.size,
    gzipSize: packageSize.gzipSize,
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
       ifnull(index_name.display_name, benchmark.benchmark) as indexName,
       benchmark.raw_value as rawValue,
       unit
from benchmark
         join benchmark_index index_name
              on benchmark.tech_stack = index_name.tech_stack
                  and benchmark.index_name = index_name.index_name
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
  // TODO sonarCloud
  res.sonar = {};
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
