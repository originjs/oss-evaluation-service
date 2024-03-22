import { authorizationHeader } from '../../util.js';

export const importGithub = async (val, token) => {
  let headers = authorizationHeader(token);
  headers.append('Content-Type', 'application/json');
  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(val),
    redirect: 'follow',
  };

  return fetch('https://gitlab.com/api/v4/import/github', requestOptions);
};

export const importFromUrl = async (val, token) => {
  let headers = authorizationHeader(token);
  headers.append('Content-Type', 'application/json');
  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(val),
    redirect: 'follow',
  };
  return fetch('https://gitlab.com/api/v4/projects/', requestOptions);
};
