import { authorizationHeader } from '../../util.js';

export function listProjectBranches(projectKey, token) {
  return fetch(`https://sonarcloud.io/api/project_branches/list?project=${projectKey}`, {
    method: 'GET',
    headers: authorizationHeader(token),
  });
}
