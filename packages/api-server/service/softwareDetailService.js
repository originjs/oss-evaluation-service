import {
  ProjectPackage, GithubProjects, StateOfJs, CncfDocumentScore,
  PackageSizeDetail, Scorecard, PackageDownloadCount,
} from '@orginjs/oss-evaluation-data-model';
import ChartData from '../model/chartData.js';

export async function getSoftwareFunction(repoName) {
  const projectId = await getProjectIdByRepoName(repoName);
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
 * @param repoName repoName
 * @returns {Promise<{firstCommit, license: *, star: *, language: *}>}
 */
export async function getSoftwareOverview(repoName) {
  const projectId = await getProjectIdByRepoName(repoName);
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

export async function getPerformance(repoName) {
  const packageName = await getMaxDownloadPackageByRepoName(repoName);
  const packageSize = await PackageSizeDetail.findOne({
    where: {
      packageName,
    },
    order: [
      ['version', 'desc'],
    ],
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
  const {
    score, maintained, codeReview, ciiBestPractices, license, branchProtection,
  } = (await Scorecard.findOne({
    where: {
      projectId,
    },
    order: [
      ['updatedAt', 'desc'],
    ],
  })) || {};
  res.scorecard = {
    score, maintained, codeReview, ciiBestPractices, license, branchProtection,
  };
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

async function getMaxDownloadPackageByRepoName(repoName) {
  const data = await ProjectPackage.findAll({
    where: {
      projectName: repoName,
    },
    attributes: ['package'],
  });

  const packageNames = data.map((item) => item.package);

  // get max download count package
  const maxDownloadPackageName = await PackageDownloadCount.findOne({
    where: {
      package_name: packageNames,
    },
    order: [
      ['downloads', 'desc'],
    ],
    attributes: ['packageName'],
  });
  if (!maxDownloadPackageName) {
    const msg = `cant find package in {${repoName}}!`;
    console.warn(msg);
    throw new Error(msg);
  }
  return maxDownloadPackageName.packageName;
}