import { createFork, deleteFork } from './src/fork.js';
import { getProjectInfo, searchProjects } from './src/project.js';
import { fetchRedirectUrl } from './src/repo.js';

const GITHUB_USER_API = 'https://api.github.com/user';

const tokenCache = {
  token: null,
  refreshing: null,
};

const parseGitHubTokens = () => {
  const raw = process.env.GITHUB_TOKEN;
  if (!raw) {
    return [];
  }
  try {
    const tokens = JSON.parse(raw);
    return Array.isArray(tokens) ? tokens.filter(token => typeof token === 'string' && token.length > 0) : [];
  } catch {
    return [];
  }
};

const validateToken = async token => {
  const response = await fetch(GITHUB_USER_API, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json',
    },
  });
  return response.ok && response.status === 200;
};

const getValidGitHubToken = async () => {
  if (tokenCache.token) {
    return tokenCache.token;
  }
  if (tokenCache.refreshing) {
    return tokenCache.refreshing;
  }
  tokenCache.refreshing = (async () => {
    for (const token of parseGitHubTokens()) {
      try {
        if (await validateToken(token)) {
          tokenCache.token = token;
          return token;
        }
      } catch {
        // ignore validation errors and continue to the next token
      }
    }
    return undefined;
  })();
  try {
    return await tokenCache.refreshing;
  } finally {
    tokenCache.refreshing = null;
  }
};

export default class GithubSdk {
  constructor(token) {
    this.token = token || null;
  }

  getToken = async () => {
    return this.token || (await getValidGitHubToken());
  };

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
  createFork = async (owner, repo, forkBody) => {
    return createFork(owner, repo, forkBody, await this.getToken());
  };

  deleteFork = async (owner, repo) => {
    return deleteFork(owner, repo, await this.getToken());
  };

  projectInfo = async (owner, repo) => {
    return getProjectInfo(owner, repo, await this.getToken());
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
    return searchProjects(condition, count, await this.getToken());
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
