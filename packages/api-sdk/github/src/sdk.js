import { createFork, deleteFork } from './fork.js';
import { getProjectInfo, searchProjects } from './project.js';

export class GithubSdk {
  constructor(token) {
    token = token || process.env.GITHUB_FORK_TOKEN;
    this.token = token;
  }

  createFork = (owner, repo) => {
    return createFork(owner, repo, this.token);
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
}
