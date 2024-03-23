import { createFork, deleteFork } from './fork.js';

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
}
