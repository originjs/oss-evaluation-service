import { appendUrlParam, authorizationHeader } from '../../util.js';
import { Result } from '../../result.js';

export function createProject(param, token) {
  const url = `https://sonarcloud.io/api/projects/create?${appendUrlParam(param)}`;
  return fetch(url, {
    method: 'POST',
    headers: authorizationHeader(token),
  });
}

export class GithubInfo {
  constructor(repoName, projectId) {
    this.repoName = repoName;
    this.projectId = projectId;
  }
}
export class createProjectInternalParam {
  constructor(projects, newCodeDefinitionValue, newCodeDefinitionType, organization) {
    this.projects = projects;
    this.newCodeDefinitionValue = newCodeDefinitionValue;
    this.newCodeDefinitionType = newCodeDefinitionType;
    this.organization = organization;
  }
}

/**
 *
 * @param param createProjectInternalParam
 * @param token token
 * @return {Promise<Result>}
 * {
 *     "projects": [
 *         {
 *             "projectKey": "oss-integration_vite"
 *         },
 *         {
 *             "projectKey": "oss-integration_esbuild"
 *         }
 *     ]
 * }
 */
export async function createProjectInternalApi(param, token) {
  const formData = new FormData();
  formData.append('newCodeDefinitionValue', param.newCodeDefinitionValue);
  formData.append('newCodeDefinitionType', param.newCodeDefinitionType);
  formData.append('organization', param.organization);

  const installationKeys = param.projects
    .map(info => `${info.repoName}|${info.projectId}`)
    .join(',');
  formData.append('installationKeys', installationKeys);

  const requestOptions = {
    method: 'POST',
    headers: authorizationHeader(token),
    body: formData,
    redirect: 'follow',
  };

  const response = fetch(
    'https://sonarcloud.io/api/alm_integration/provision_projects',
    requestOptions,
  );
  return Result.response2Result(response);
}

/**
 * active auto scan
 * @param projectKey projectKey
 * @param token token
 * @return {Promise<Result>}
 */
export function activeAutoScanInternalApi(projectKey, token) {
  return fetch(
    `https://sonarcloud.io/api/autoscan/eligibility?autoEnable=true&projectKey=${projectKey}`,
    {
      method: 'GET',
      headers: authorizationHeader(token),
    },
  );
}

export function setAutoScanInternalApi(projectKey, enable, token) {
  const formData = new FormData();
  formData.append('projectKey', projectKey);
  formData.append('enable', enable);
  const requestOptions = {
    method: 'POST',
    headers: authorizationHeader(token),
    body: formData,
  };
  return Result.response2ResultOnlyStatus(
    fetch('https://sonarcloud.io/api/autoscan/activation', requestOptions),
  );
}

export function deleteProject(projectKey, token) {
  const url = `https://sonarcloud.io/api/projects/delete?project=${projectKey}`;
  return Result.response2ResultOnlyStatus(
    fetch(url, {
      method: 'POST',
      headers: authorizationHeader(token),
    }),
  );
}
