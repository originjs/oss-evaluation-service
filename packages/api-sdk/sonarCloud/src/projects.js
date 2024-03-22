import { authorizationHeader } from '../../util.js';


export function createProject(param, token) {
  let url = 'https://sonarcloud.io/api/projects/create?';
  for (const key in param) {
    if (Object.prototype.hasOwnProperty.call(param, key) && param[key] !== null) {
      url = `${url}${encodeURI(key)}=${encodeURI(param[key])}&`;
    }
  }
  url = url.substring(0, url.length - 1);
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
 * @return {Promise<Response>}
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
export function createProjectInternalApi(param, token) {
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

  return fetch('https://sonarcloud.io/api/alm_integration/provision_projects', requestOptions);
}

/**
 * active auto scan
 * @param projectKey projectKey
 * @param token token
 * @return {Promise<Response>}
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
