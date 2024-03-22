import { importFromUrl, importGithub } from './import.js';

export class GitlabSdk {
  constructor(token) {
    token = token || process.env.GITLAB_FORK_TOKEN;
    this.token = token;
  }

  importGithubProject = val => {
    return importGithub(val, this.token);
  };

  importFromUrl = val => {
    return importFromUrl(val, this.token);
  };
}
