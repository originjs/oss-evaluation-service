import { authorizationHeader } from '../../util.js';

export const createCommit = (projectId, commitInfo, token) => {
  const url = `https://gitlab.com/api/v4/projects/${projectId}/repository/commits`;
  const headers = authorizationHeader(token);
  headers.append('Content-Type', 'application/json');
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(commitInfo),
  });
};
