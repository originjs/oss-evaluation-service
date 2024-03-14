import {
  ProjectPackage,
  GithubProjects,
  StateOfJs,
  CncfDocumentScore,
  PackageSizeDetail,
  Scorecard,
  EvaluationSummary,
} from '@orginjs/oss-evaluation-data-model';
import dayjs from 'dayjs';
import ChartData from '../model/chartData.js';

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
    stateOfJsData.forEach((item) => {
      x.push(item.year);
      y.push(item.satisfactionPercentage);
    });
    res.satisfaction = new ChartData(x, y);
  }

  // documentation best practices
  const {
    documentScore, hasReadme, hasChangelog, hasWebsite, hasContributing,
  } = (await CncfDocumentScore.findOne({
    where: {
      projectId,
    },
    attributes: [
      'documentScore', 'hasReadme', 'hasChangelog', 'hasWebsite', 'hasContributing',
    ],
  })) || {};
  res.document = {
    documentScore,
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

  return {
    url: githubInfo.htmlUrl,
    logo: githubInfo.ownerAvatarUrl,
    star: githubInfo.stargazersCount,
    language: githubInfo.language,
    firstCommit: dayjs(new Date(githubInfo.createdAt)).format('YYYY-MM-DD HH:mm:ss'),
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

  return {
    size: packageSize.size,
    gzipSize: packageSize.gzipSize,
    //   TODO benchmark score
    benchmarkScore: 0,
  };
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
