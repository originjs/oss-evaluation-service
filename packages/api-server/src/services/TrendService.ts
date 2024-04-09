import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { EvaluationSummary } from '@orginjs/oss-evaluation-data-model';

export class ChartData {
  xAxis: [];
  yAxis: [];

  constructor(x: [], y: []) {
    this.xAxis = x;
    this.yAxis = y;
  }
}

export class Page {
  pageSize: number;
  pageNo: number;
  data: any[];

  constructor(pageNo: number, pageSize: number, data?: any[]) {
    this.pageSize = pageSize;
    this.pageNo = pageNo;
    this.data = data!;
  }

  static clone(page: Page) {
    return new Page(page.pageNo, page.pageSize, page.data);
  }

  format() {
    if (!this.pageSize || this.pageSize <= 0 || this.pageSize >= 100) {
      this.pageSize = 10;
    }
    this.pageNo = !this.pageNo || this.pageNo <= 0 ? 1 : this.pageNo;
  }
}

const typeMap = new Map();
typeMap.set('star', 'stargazersCount');
typeMap.set('fork', 'forksCount');
typeMap.set('contributors', 'contributorCount');

GithubProjects.hasOne(EvaluationSummary, {
  foreignKey: 'project_id',
  as: 'evaluationSummary',
});

EvaluationSummary.belongsTo(GithubProjects, {
  foreignKey: 'project_id',
  as: 'project',
});

export async function githubTop(page: Page, type: string) {
  if (!typeMap.has(type)) {
    throw new Error(`unknown trend page top type:{${type}}`);
  }
  const pageSize = page.pageSize;
  const offset = page.pageSize * (page.pageNo - 1);

  const result = await GithubProjects.findAll({
    include: [
      {
        model: EvaluationSummary,
        as: 'evaluationSummary',
        required: true,
      },
    ],
    order: [
      type === 'contributors'
        ? [{ model: EvaluationSummary, as: 'evaluationSummary' }, typeMap.get(type), 'DESC']
        : [typeMap.get(type), 'DESC'],
    ],
    limit: pageSize,
    offset: offset,
  });
  const resData = result.map(item => {
    return {
      name: item.fullName,
      logo: item.ownerAvatarUrl,
      htmlUrl: item.htmlUrl,
      starCount: item.stargazersCount,
      forkCount: item.forksCount,
      contributorCount: item.evaluationSummary.contributorCount,
      // TODO star/fork/contributor trend
      trend: new ChartData([], []),
    };
  });
  const res = Page.clone(page);
  res.data = resData;
  return res;
}
