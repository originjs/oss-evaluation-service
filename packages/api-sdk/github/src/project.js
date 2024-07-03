import { Result } from '../../result.js';
import { authorizationHeader } from '../../util.js';

const keyMap = new Map();
keyMap.set('forks', 'forks_count');
keyMap.set('stars', 'stargazers_count');

export const githubCommonHeader = token => {
  const headers = authorizationHeader(token);
  headers.append('Accept', 'application/vnd.github.v3+json');
  headers.append('X-GitHub-Api-Version', '2022-11-28');
  return headers;
};

export const getProjectInfo = async (owner, repo, token) => {
  const headers = githubCommonHeader(token);
  return Result.response2Result(
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'GET',
      headers,
    }),
  );
};

export const searchProjects = async (search, count, token) => {
  let res = [];
  const projectIds = new Set();
  const pageSize = 100;
  search.sort = search.sort ?? 'stars';
  search.order = search.order ?? 'desc';
  const header = githubCommonHeader(token);
  for (let page = 1; res.length < count; page++) {
    const url = `https://api.github.com/search/repositories?q=${search.condition}&sort=${search.sort}&order=${search.order}&page=${page}&per_page=${pageSize}`;
    const response = await fetch(url, { method: 'GET', headers: header });
    if (response.ok) {
      const data = await response.json();
      if (data.items.length === 0) {
        break;
      }
      const validData = data.items.filter(val => !projectIds.has(val.id));
      res.push(...validData);
      validData.forEach(val => projectIds.add(val.id));
    } else {
      throw new Error(`search github project err , ${response.code}:${await response.text()}`);
    }
  }
  res = res.length > count ? res.slice(0, count) : res;
  return res.sort((a, b) => b[keyMap.get(search.sort)] - a[keyMap.get(search.sort)]);
};
