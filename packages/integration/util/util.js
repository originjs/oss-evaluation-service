import { GithubProjects, logger } from '@orginjs/oss-evaluation-data-model';
import { setTimeout } from 'node:timers';

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
  const project = await GithubProjects.findOne({
    attributes: ['id', 'name', 'ownerName', 'ownerType', 'fullName', 'htmlUrl', 'language'],
    where: {
      htmlUrl: repoUrl,
    },
  });
  if (project === null) {
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
