import { activeAutoScanInternalApi, createProject, createProjectInternalApi } from './projects.js';
import { deleteBranch, listProjectBranches, renameMainBranch } from './projectBranches.js';

export class SonarCloudSdk {
  constructor(token) {
    token = token || process.env.SONAR_CLOUD_TOKEN;
    this.token = token;
  }

  /**
   * {
   *  name: 'vite'
   *  newCodeDefinitionValue: 30,
   *  newCodeDefinitionType: 'days',
   *  organization: 'vitejs',
   *  visibility :'public',
   *  project: 'vite'
   * }
   * @param param
   * @return {Promise<Response>}
   */
  createProject = param => {
    return createProject(param, this.token);
  };

  createProjectInternalApi = param => {
    return createProjectInternalApi(param, this.token);
  };

  activeAutoScanInternalApi = projectKey => {
    return activeAutoScanInternalApi(projectKey, this.token);
  };

  listProjectBranches = projectKey => {
    return listProjectBranches(projectKey, this.token);
  };

  deleteBranch = async (projectKey, branchName) => {
    return deleteBranch(projectKey, branchName, this.token);
  };
  renameMainBranch = async (projectKey, newBranchName) => {
    return renameMainBranch(projectKey, newBranchName, this.token);
  };
}
