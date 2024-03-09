import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import Page from '../model/page.js';

const typeMap = new Map();
typeMap.set('star', 'stargazersCount');
typeMap.set('fork', 'forksCount');
// typeMap.set("contributors" , "stargazers_count");

// eslint-disable-next-line import/prefer-default-export
export async function githubTop(page, type) {
  if (!typeMap.has(type)) {
    throw new Error(`unknown trend page top type:{${type}}`);
  }
  const data = await GithubProjects.findAll({
    limit: page.pageSize,
    order: [
      [typeMap.get(type), 'desc'],
    ],
    offset: page.pageSize * (page.pageNo - 1),
  });
  const resData = data.map((item) => {
    const _ = {};
    _.githubUrl = item.htmlUrl;
    _.starCount = item.stargazersCount;
    _.forkCount = item.forksCount;
    return _;
  });
  const res = Page.clone(page);
  res.data = resData;
  return res;
}
