import {
  ProjectPackage, GithubProjects, StateOfJs, CncfDocumentScore,
  PackageSizeDetail, Scorecard,
} from '@orginjs/oss-evaluation-data-model';
import ChartData from '../model/chartData.js';

export async function getSoftwareFunction(packageName) {
  const { projectId } = await getProjectInfoByPackageName(packageName);
  const stateOfJsData = await StateOfJs.findAll({
    where: {
      projectId,
    },
    order: [
      ['year', 'asc'],
    ],
  });
  const res = {};
  // TODO github star trends
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
    documentScore, hasReadme, hasChangelog, hasWebsite, hasContributing, hasRelease,
  } = (await CncfDocumentScore.findOne({
    where: {
      projectId,
    },
  })) || {};
  res.document = {
    documentScore,
    hasReadme,
    hasChangelog,
    hasWebsite,
    hasContributing,
    hasRelease,
  };
  return res;
}

/**
 * get software overview
 * @param packageName packageName
 * @returns {Promise<{firstCommit, license: *, star: *, language: *}>}
 */
export async function getSoftwareOverview(packageName) {
  const { projectId } = await getProjectInfoByPackageName(packageName);
  //   get star num
  const githubInfo = await GithubProjects.findOne({
    where: {
      id: projectId,
    },
  });

  return {
    star: githubInfo.stargazersCount,
    language: githubInfo.language,
    firstCommit: githubInfo.createdAt,
    license: githubInfo.license,
    description: githubInfo.description,
    tags: githubInfo.topics,
  };
}

export async function getPerformance(packageName) {
  const packageSize = await PackageSizeDetail.findOne({
    where: {
      packageName,
    },
    order: [
      ['version', 'desc'],
    ],
  });

  return {
    size: packageSize.size,
    gzipSize: packageSize.gzipSize,
    //   TODO benchmark score
    benchmarkScore: 0,
  };
}

export async function getQuality(packageName) {
  const { projectId } = await getProjectInfoByPackageName(packageName);
  const res = {};
  const {
    score, maintained, codeReview, ciiBestPractices, license, branchProtection,
  } = (await Scorecard.findOne({
    where: {
      projectId,
    },
    order: [
      ['updated_at', 'desc'],
    ],
  })) || {};
  res.scorecard = {
    score, maintained, codeReview, ciiBestPractices, license, branchProtection,
  };
  // TODO sonarCloud
  res.sonar = {};
  return res;
}

async function getProjectInfoByPackageName(packageName) {
  const data = await ProjectPackage.findOne({
    where: {
      package: packageName,
    },
  });

  if (!data) {
    const msg = `cant find project named {${packageName}}!`;
    console.warn(msg);
    throw new Error(msg);
  }
  return data;
}
