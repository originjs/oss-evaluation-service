import {
  GithubProjects,
  TrendHistory,
  EvaluationSummary,
  GithubProjectsStargazersTrend,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import _ from 'underscore';
import { Op } from 'sequelize';
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

const STAGE_TYPE = {
  CURRENT: 1,
  LAST: 0,
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

async function getTrendData(type, stageType) {
  const dataType = type.dataType;
  const dateType = type.dateType;
  const rankType = type.rankType;
  let orderCriteria;
  if (rankType == 1) {
    orderCriteria = [
      ['date', 'ASC'],
      ['increasedValue', 'DESC'],
    ];
  } else {
    orderCriteria = [
      ['date', 'ASC'],
      ['totalValue', 'DESC'],
    ];
  }

  let date = dayjs();
  let startDate, endDate;

  // 年数据处理
  if (dateType == 1) {
    if (stageType === STAGE_TYPE.LAST) {
      date = date.subtract(1, 'year');
    }
    startDate = date.startOf('year').toDate();
    startDate = date.add(1, 'year').startOf('year').toDate();
  }
  // 月数据处理
  if (dateType == 2) {
    if (stageType === STAGE_TYPE.LAST) {
      date = date.subtract(1, 'month');
    }
    startDate = date.startOf('month').toDate();
    endDate = date.add(1, 'month').startOf('month').toDate();
  }
  const result = await TrendHistory.findAll({
    attributes: ['projectId', 'increasedValue', 'totalValue', 'date'],
    where: {
      date: {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      },
      dataType: dataType,
      dateType: dateType,
    },
    order: orderCriteria,
  }).catch(err => {
    logger.error('Error occurred:', err);
  });
  // 去重，保留更早的数据
  const firstDataMap = new Map();
  const deduplicatedResults = result.filter(data => {
    const projectId = data.projectId;
    if (!firstDataMap.has(projectId)) {
      firstDataMap.set(projectId, true);
      return true;
    }
    return false;
  });

  // 增加排名列
  let rank = 1;
  let prevValue = null;
  let prevRank = 1;

  deduplicatedResults.forEach(row => {
    let tempValue;
    if (rankType == 1) {
      tempValue = row.increasedValue;
    } else {
      tempValue = row.totalValue;
    }
    if (tempValue !== prevValue) {
      row.rank = rank;
      prevRank = rank;
    } else {
      row.rank = prevRank;
    }
    rank++;
    prevValue = row.increasedValue;
  });

  return deduplicatedResults;
}

export async function newGithubTop(
  page: Page,
  type: { dataType: string; dateType: string; rankType: string },
) {
  const pageSize = page.pageSize;
  const offset = page.pageSize * (page.pageNo - 1);

  const currentTrendData = await getTrendData(type, 1);
  const result = currentTrendData.slice(offset, offset + pageSize);
  const lastTrendData = await getTrendData(type, 0);

  const data = [];
  for (const item of result) {
    const lastPeriodRank = lastTrendData.find(
      lastItem => lastItem.projectId === item.projectId,
    )?.rank;

    const projectInfo = await GithubProjects.findOne({
      where: {
        id: item.projectId,
      },
      attributes: ['fullName', 'htmlUrl', 'description', 'ownerAvatarUrl'],
    });

    data.push({
      currentRank: item.rank,
      lastRank: lastPeriodRank,
      increasedValue: item.increasedValue,
      totalValue: item.totalValue,
      name: projectInfo.fullName,
      logo: projectInfo.ownerAvatarUrl,
      htmlUrl: projectInfo.htmlUrl,
      description: projectInfo.description,
    });
  }

  const res = Page.clone(page);
  res.data = data;
  return res;
}
