import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import debug from 'debug';

export const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

/**
 * @async
 * @param {string} repoUrl github project url
 * @returns {Promise<*>} project basic information
 */
export async function getProjectByUrl(repoUrl) {
  const project = await GithubProjects.findOne({
    attributes: ['id', 'htmlUrl'],
    where: {
      htmlUrl: repoUrl,
    },
  });
  if (project === null) {
    debug.log('project not exists');
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
    throw new Error('The repoUrl is not a  valid GitHub main repository address');
  }
}
