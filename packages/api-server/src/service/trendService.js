import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import Page from '../model/page.js';
import ChartData from '../model/chartData.js';

const typeMap = new Map();
typeMap.set('star', 'stargazersCount');
typeMap.set('fork', 'forksCount');
// typeMap.set("contributors" , "stargazers_count");

export async function githubTop(page, type) {
  if (!typeMap.has(type)) {
    throw new Error(`unknown trend page top type:{${type}}`);
  }
  const data = await GithubProjects.findAll({
    limit: page.pageSize,
    order: [[typeMap.get(type), 'desc']],
    offset: page.pageSize * (page.pageNo - 1),
  });
  const resData = data.map(item => {
    const { htmlUrl } = item;
    return {
      htmlUrl,
      starCount: item.stargazersCount,
      forkCount: item.forksCount,
      // TODO contributor count
      contributorCount: null,
      // TODO star/fork/contributor trend
      trend: new ChartData([], []),
    };
  });
  const res = Page.clone(page);
  res.data = resData;
  return res;
}
