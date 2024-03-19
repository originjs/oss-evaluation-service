import { createProject, createProjectInternalApi } from './projects.js';

export class SonarCloudSdk {
  constructor(token) {
    this.token = token;
  }

  createProject(param) {
    return createProject(param, this.token);
  }

  createProjectInternalApi(param) {
    return createProjectInternalApi(param, this.token);
  }
}
