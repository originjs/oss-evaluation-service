import { authorizationHeader } from '../../util.js';

export const listProjectBranches = (projectKey, token) => {
  return fetch(`https://sonarcloud.io/api/project_branches/list?project=${projectKey}`, {
    method: 'GET',
    headers: authorizationHeader(token),
  });
};

export const deleteBranch = async (projectKey, branchName, token) => {
  const requestOptions = {
    method: 'POST',
    headers: authorizationHeader(token),
  };

  return fetch(
    `https://sonarcloud.io/api/project_branches/delete?branch=${encodeURI(branchName)}&project=${encodeURI(projectKey)}`,
    requestOptions,
  );
};

export const renameMainBranch = async (projectKey, newBranchName, token) => {
  const requestOptions = {
    method: 'POST',
    headers: authorizationHeader(token),
  };

  return fetch(
    `https://sonarcloud.io/api/project_branches/rename?name=${encodeURI(newBranchName)}&project=${encodeURI(projectKey)}`,
    requestOptions,
  );
};
