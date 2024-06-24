import { createFork, deleteFork } from './fork.js';
import { getProjectInfo, getRankProjects } from './project.js';

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
   get rank projects of github
   @async
   @param {'stars'|'forks'} type - rank types
   @param {number} count - num of projects, count > 0 & count < 1000
   @returns {Promise<Object[]>} - reponse
   @throws {Error} - request Error
  */
  rankProjects = async (type, count) => {
    return getRankProjects(type, count);
  };
}
