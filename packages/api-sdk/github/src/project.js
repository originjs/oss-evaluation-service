import { Result } from '../../result.js';
import { authorizationHeader } from '../../util.js';

const keyMap = new Map();
keyMap.set('forks', 'forks_count');
keyMap.set('stars', 'stargazers_count');

export const getProjectInfo = async (owner, repo, token) => {
  const headers = authorizationHeader(token);
  headers.append('Accept', 'application/vnd.github.v3+json');
  headers.append('X-GitHub-Api-Version', '2022-11-28');
  return Result.response2Result(
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      method: 'GET',
      headers,
    }),
  );
};

export const getRankProjects = async (type, count) => {
  let res = [];
  const projectIds = new Set();
  for (let page = 1; res.length < count; page++) {
    // dont use per_page param to set page size!!!
    const url = `https://api.github.com/search/repositories?q=${type}:>0&sort=${type}&order=desc&page=${page}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.items.length === 0) {
        break;
      }
      const validData = data.items.filter(val => !projectIds.has(val.id));
      res.push(...validData);
      validData.forEach(val => projectIds.add(val.id));
    } else {
      throw new Error(`get rank project err , ${response.code}:${await response.text()}`);
    }
  }
  res = res.length > count ? res.slice(0, count) : res;
  return res.sort((a, b) => b[keyMap.get(type)] - a[keyMap.get(type)]);
};
