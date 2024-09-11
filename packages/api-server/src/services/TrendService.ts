import {
  GithubProjects,
  EvaluationSummary,
  GithubProjectsStargazersTrend,
  logger,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import _ from 'underscore';
import dayjs from 'dayjs';

export class ChartData {
  monthCount: number[];
  monthDiff: number[];

  constructor(x: number[], y: number[]) {
    this.monthCount = x;
    this.monthDiff = y;
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
typeMap.set('contributors', 'contributors');

const DATE_TYPE = {
  YEAR: 1,
  MONTH: 2,
};

const RANK_TYPE = {
  INCREASE: 1,
  TOTAL: 2,
};

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
    attributes: [
      ['full_name', 'fullName'],
      ['owner_avatar_url', 'ownerAvatarUrl'],
      ['html_url', 'htmlUrl'],
      ['stargazers_count', 'stargazersCount'],
      ['forks_count', 'forksCount'],
      'contributors',
    ],
    order: [[typeMap.get(type), 'DESC']],
    limit: pageSize,
    offset: offset,
  });
  const data = [];
  for (const item of result) {
    const softwareTrend = await GithubProjectsStargazersTrend.findAll({
      where: {
        fullName: item.fullName,
      },
      order: [['date', 'asc']],
    });

    const monthDiff = softwareTrend.map((current, index, array) => {
      if (index === 0) return 0;
      return current.stargazers - array[index - 1].stargazers;
    });

    const monthCount = _.pluck(softwareTrend, 'stargazers');
    data.push({
      name: item.fullName,
      logo: item.ownerAvatarUrl,
      htmlUrl: item.htmlUrl,
      starCount: item.stargazersCount,
      forkCount: item.forksCount,
      contributors: item.contributors,
      trend: new ChartData(monthCount, monthDiff),
    });
  }
  const res = Page.clone(page);
  res.data = data;
  return res;
}

async function getTrendData(type, githubProjectIds, page) {
  const dataType = type.dataType;
  const dateType = type.dateType;
  const rankType = type.rankType;
  const pageSize = page.pageSize;
  const offset = page.pageSize * (page.pageNo - 1);
  const orderCriteria =
    rankType == RANK_TYPE.INCREASE
      ? `increased_value desc, total_value desc`
      : `total_value desc, increased_value desc`;

  let date = dayjs();
  let selectedDate;

  if (dateType == DATE_TYPE.YEAR) {
    selectedDate = date.startOf('year').toDate();
  } else if (dateType == DATE_TYPE.MONTH) {
    selectedDate = date.startOf('month').toDate();
  }

  const inProjectsSQL = githubProjectIds ? `and project_id in (:githubProjectIds)` : ``;

  const QUERY_CURRENT_RANK = `select project_id as projectId, increased_value as increasedValue,
      total_value as totalValue, row_number() over () as currentRank
      from trend_history
      where data_type = :dataType
        and date_type = :dateType
        and date = :selectedDate
        ${inProjectsSQL}
      order by ${orderCriteria}
      limit :pageSize offset :offset`;
  const result = await sequelize
    .query(QUERY_CURRENT_RANK, {
      replacements: { dataType, dateType, selectedDate, githubProjectIds, pageSize, offset },
      type: sequelize.QueryTypes.SELECT,
    })
    .catch(err => {
      logger.error('Error occurred:', err);
    });
  const showedProjectIds = result.map(item => item.projectId);

  // 获取上一阶段排名
  if (dateType == DATE_TYPE.YEAR) {
    date = date.subtract(1, 'year');
    selectedDate = date.startOf('year').toDate();
  } else if (dateType == DATE_TYPE.MONTH) {
    date = date.subtract(1, 'month');
    selectedDate = date.startOf('month').toDate();
  }

  const QUERY_LAST_RANK = `select project_id as projectId, lastRank
      from (select history.*, row_number() over () as lastRank
      from trend_history history
      where history.data_type = :dataType
        and date_type = :dateType
        and date = :selectedDate
        ${inProjectsSQL}
      order by ${orderCriteria}) tmp
      where project_id in (:showedProjectIds);`;
  const lastRankResult = await sequelize
    .query(QUERY_LAST_RANK, {
      replacements: { dataType, dateType, selectedDate, githubProjectIds, showedProjectIds },
      type: sequelize.QueryTypes.SELECT,
    })
    .catch(err => {
      logger.error('Error occurred:', err);
    });

  const lastRankMap = {};
  lastRankResult.forEach(item => {
    lastRankMap[item.projectId] = item.lastRank;
  });
  result.forEach(item => {
    item.lastRank = lastRankMap[item.projectId];
  });

  return result;
}

export async function newGithubTop(
  page: Page,
  type: { dataType: string; dateType: string; rankType: string; language: string },
) {
  const language = type.language === 'All' ? null : type.language;

  const githubProjects = language
    ? await GithubProjects.findAll({
        attributes: ['id'],
        where: {
          language: language,
        },
      })
    : null;

  const githubProjectIds = githubProjects ? githubProjects.map(project => project.id) : null;
  const result = await getTrendData(type, githubProjectIds, page);
  const data = [];
  for (const item of result) {
    const projectInfo = await GithubProjects.findOne({
      where: {
        id: item.projectId,
      },
      attributes: ['fullName', 'htmlUrl', 'description', 'ownerAvatarUrl', 'createdAt'],
    });

    data.push({
      currentRank: item.currentRank,
      lastRank: item.lastRank,
      increasedValue: item.increasedValue,
      totalValue: item.totalValue,
      name: projectInfo.fullName,
      logo: projectInfo.ownerAvatarUrl,
      htmlUrl: projectInfo.htmlUrl,
      description: projectInfo.description,
      createdAt: projectInfo.createdAt.slice(0, 10),
    });
  }

  const res = Page.clone(page);
  res.data = data;
  return res;
}
