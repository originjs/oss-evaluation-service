import { createFork, deleteFork } from './src/fork.js';
import { getProjectInfo, searchProjects } from './src/project.js';
import { fetchRedirectUrl } from './src/repo.js';

export default class GithubSdk {
  constructor(token) {
    token = token || process.env.GITHUB_FORK_TOKEN;
    this.token = token;
  }

  /**
   * @typedef {Object} ForkBody
   * @param {string} organization - organization
   * @param {string} name - repoName
   * @param {boolean} default_branch_only - only fork default branch?
   */

  /**
   * @param {string} owner - owner
   * @param {string} repo - repoName
   * @param {ForkBody} forkBody - fork body param
   */
  createFork = (owner, repo, forkBody) => {
    return createFork(owner, repo, forkBody, this.token);
  };

  deleteFork = (owner, repo) => {
    return deleteFork(owner, repo, this.token);
  };

  projectInfo = (owner, repo) => {
    return getProjectInfo(owner, repo, this.token);
  };

  /**
   * @typedef {Object} SearchCondition
   * @property {string} condition - condition
   * @property {'stars'|'forks'} sort - sort
   * @property {'asc'|'desc'} order - order
   */

  /**
   search projects of github
   @async
   @param {{condition: *}} condition - search condition
   @param {number} count - num of projects, count > 0 & count < 1000
   @returns {Promise<Object[]>} - reponse
   @throws {Error} - request Error
  */
  searchProjects = async (condition, count) => {
    return searchProjects(condition, count, this.token);
  };

  /**
   get repo redirect url
   @async
   @param {url} string - github repo html url
   @returns {Promise<Result<Object>} - result
  */
  getRedirectUrl = async url => {
    return fetchRedirectUrl(url);
  };
}
