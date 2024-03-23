import { authorizationHeader } from '../../util.js';

export const getProjectInfo = async (projectId, token) => {
  return fetch(`https://gitlab.com/api/v4/projects/${projectId}`, {
    method: 'GET',
    headers: authorizationHeader(token),
  });
};
