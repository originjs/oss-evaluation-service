import { importFromUrl, importGithub } from './import.js';
import { getProjectInfo } from './project.js';
import { createCommit } from './commit.js';

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

  getProjectInfo = projectId => {
    return getProjectInfo(projectId, this.token);
  };

  /**
   * @param projectId
   * @param commitInfo
   * {
   *   "branch": "main",
   *   "commit_message": "some commit message",
   *   "actions": [
   *     {
   *       "action": "create",
   *       "file_path": "foo/bar",
   *       "content": "some content"
   *     },
   *     {
   *       "action": "delete",
   *       "file_path": "foo/bar2"
   *     }
   *   ]
   * }
   */
  createCommit = (projectId, commitInfo) => {
    return createCommit(projectId, commitInfo, this.token);
  };
}
