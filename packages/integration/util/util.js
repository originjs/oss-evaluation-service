import { ViewProjects, logger } from '@orginjs/oss-evaluation-data-model';
import { setTimeout } from 'node:timers';
import { platformTypes } from '@orginjs/oss-evaluation-util';

export const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

export const timer = (fn, param, ms) =>
  new Promise(resolve => {
    setTimeout(async () => {
      const res = await fn(param);
      resolve(res);
    }, ms);
  });
/**
 * @async
 * @param {string} repoUrl github project url
 * @returns {Promise<*>} project basic information
 */
export async function getProjectByUrl(repoUrl) {
  const project = await ViewProjects.findOne({
    where: {
      htmlUrl: repoUrl,
    },
  });
  if (!project) {
    logger.info('project not exists');
    return;
  }
  return project;
}

/**
 * Parse GitHub main repository url
 * @param {string} repoUrl GitHub repository url
 * @returns {{owner: string, protocol: string, address: string, repository: string}}
 * @throws {Error}
 */
export function parseRepoUrl(repoUrl) {
  const regex = /^(https?:)\/\/(github\.com)\/([^/]+)\/([^/]+)$/;
  const match = repoUrl.match(regex);
  if (match) {
    return {
      protocol: match[1], // "https://"
      address: match[2], //github.com
      owner: match[3], // 用户名或组织名
      repository: match[4], // 仓库名
    };
  } else {
    logger.error('The repoUrl is not a  valid GitHub main repository address');
    throw new Error('The repoUrl is not a  valid GitHub main repository address');
  }
}

export function getCurrentDate() {
  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;

  let formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

const validToken = {
  [platformTypes.GITHUB]: JSON.parse(process.env.GITHUB_TOKEN)[0],
  [platformTypes.GITEE]: JSON.parse(process.env.GITEE_TOKEN)[0],
  [platformTypes.GITCODE]: JSON.parse(process.env.GITCODE_TOKEN)[0],
};

export const getValidToken = platformType => {
  return validToken[platformType];
};

export const refreshValidToken = async platformType => {
  const tokenMap = {
    [platformTypes.GITHUB]: JSON.parse(process.env.GITHUB_TOKEN),
    [platformTypes.GITEE]: JSON.parse(process.env.GITEE_TOKEN),
    [platformTypes.GITCODE]: JSON.parse(process.env.GITCODE_TOKEN),
  };
  const project = await ViewProjects.findOne({
    where: {
      platformType,
    },
  });
  const urlMap = {
    [platformTypes.GITHUB]: `https://api.github.com/repos/${project.repoName}/contributors?per_page=100&page=1&anon=true`,
    [platformTypes.GITEE]: `https://gitee.com/api/v5/repos/${project.repoName}/contributors?type=authors`,
    [platformTypes.GITCODE]: `https://api.gitcode.com/api/v5/repos/${project.repoName}/contributors/statistic`,
  };
  const tokens = tokenMap[platformType];
  const url = urlMap[platformType];
  for (const token of tokens) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok && response.status === 200) {
        validToken[platformType] = token;
        return token;
      }
    } catch (error) {
      logger.error(`Error fetching repo data with token: ${token}`, error);
    }
  }
  logger.error('No valid token found');
  validToken[platformType] = null;
  return null;
};
