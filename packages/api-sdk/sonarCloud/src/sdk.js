import { activeAutoScanInternalApi, createProject, createProjectInternalApi } from './projects.js';
import { listProjectBranches } from './projectBranches.js';

export class SonarCloudSdk {
  constructor(token) {
    token = token || process.env.SONAR_CLOUD_TOKEN;
    this.token = token;
  }

  createProject(param) {
    return createProject(param, this.token);
  }

  createProjectInternalApi(param) {
    return createProjectInternalApi(param, this.token);
  }

  activeAutoScanInternalApi(projectKey) {
    return activeAutoScanInternalApi(projectKey, this.token);
  }

  listProjectBranches(projectKey) {
    return listProjectBranches(projectKey, this.token);
  }
}
