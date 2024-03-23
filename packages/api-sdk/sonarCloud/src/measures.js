import { appendUrlParam, authorizationHeader } from '../../util.js';

export const getMeasures = (param, token) => {
  const requestOptions = {
    method: 'GET',
    headers: authorizationHeader(token),
  };
  const url = `https://sonarcloud.io/api/measures/component?${appendUrlParam(param)}`;
  return fetch(url, requestOptions);
};
