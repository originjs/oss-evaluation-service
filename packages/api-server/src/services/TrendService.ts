import {
  GithubProjects,
  EvaluationSummary,
  GithubProjectsStargazersTrend,
  sequelize,
  TrendHistory,
} from '@orginjs/oss-evaluation-data-model';
import {
  mondayOfCurrentWeek,
  mondayOfPreviousWeek,
  firstDayOfCurrentMonth,
  firstDayOfPreviousMonth,
  firstDayOfCurrentYear,
  simpleDateFormat,
  simpleWeekFormat,
} from '@orginjs/oss-evaluation-util';
import _ from 'underscore';
import { Op } from 'sequelize';
import type { Dayjs } from 'dayjs';
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
  WEEK: 3,
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

/**
 * Retrieves the top GitHub projects based on specified ranking parameters.
 *
 * @param page - The pagination information including page number and size.
 * @param rankParam - The ranking parameters.
 * @param rankParam.dataType - The type of data to filter (e.g., stars, forks).
 * @param rankParam.dateType - The type of date to filter (e.g., year, month, week).
 * @param rankParam.rankType - The ranking type (e.g., increase or total).
 * @param rankParam.language - The programming language filter for the projects.
 *
 * @returns A Promise that resolves to a Page object containing the ranked projects.
 *
 * @throws Error if the rank type is unknown.
 */
export async function githubRank(
  page: Page,
  rankParam: { dataType: string; dateType: string; rankType: string; language: string[] },
) {
  const dataType = parseInt(rankParam.dataType);
  const dateType = parseInt(rankParam.dateType);
  const rankType = parseInt(rankParam.rankType);
  const pageSize = page.pageSize;
  const offset = page.pageSize * (page.pageNo - 1);
  const { current: curDate, previous: previousDate } = await getDatabaseDateByType(
    dateType,
    dataType,
  );
  const languageFilterSQL = rankParam.language?.length
    ? ' and project_id in (select id from github_projects where language in (:language)) '
    : '';
  const baseSQL = `select project_id as projectId,
        increased_value as increasedValue,
        total_value as totalValue,
        row_number() over (
          order by ${
            rankType === RANK_TYPE.INCREASE
              ? 'increased_value desc, total_value desc'
              : 'total_value desc, increased_value desc'
          }) as \`rank\`
        from trend_history
        where 
          date = :date
          and data_type = :dataType
          and date_type = :dateType
          `;
  const removeNoneValSQL = ` and ${rankType === RANK_TYPE.INCREASE ? ' increased_value ' : ' total_value '} is not null
    and ${rankType === RANK_TYPE.INCREASE ? ' increased_value ' : ' total_value '} > 0`;
  const orderSQL = 'order by `rank`';
  const pageSQL = ` limit :pageSize offset :offset`;

  // Returns up to the top 500 data
  const queryCurrent = `
          select * from (
          ${baseSQL}
          ${languageFilterSQL}
          ${removeNoneValSQL}
          ${orderSQL}
          ${pageSQL} ) tmp
          where \`rank\` <= 500 `;
  const commonReplacements = {
    dataType,
    dateType,
    language: rankParam.language,
  };
  type ProjectRank = {
    projectId: number;
    increasedValue: number;
    totalValue: number;
    rank: number;
  };

  const currentResult: ProjectRank[] = await sequelize.query(queryCurrent, {
    replacements: {
      date: simpleDateFormat(curDate),
      pageSize,
      offset,
      ...commonReplacements,
    },
    type: sequelize.QueryTypes.SELECT,
  });
  // query only the data returned by rank
  const filteredProjectIds: number[] = currentResult.map(item => item.projectId);
  const inProjectIdSQL = filteredProjectIds.length ? ' and projectId in (:projectIds) ' : '';
  // query previous period rank
  const queryPreviousPeriodSQL = `
      select * from (${baseSQL}
      ${languageFilterSQL}
      ${removeNoneValSQL}
      ${orderSQL}) tmp
      where 1 = 1
      ${inProjectIdSQL}
      `;
  const previousResult: ProjectRank[] = await sequelize.query(queryPreviousPeriodSQL, {
    replacements: {
      date: simpleDateFormat(previousDate),
      projectIds: filteredProjectIds,
      ...commonReplacements,
    },
    type: sequelize.QueryTypes.SELECT,
  });
  const tableData = [];
  // previous period rank map <number,rank>
  const previousMap = new Map<number, ProjectRank>();
  previousResult.forEach(result => previousMap.set(result.projectId, result));

  const projectInfo: GithubProjects[] = await GithubProjects.findAll({
    attributes: [
      'id',
      'fullName',
      'htmlUrl',
      'description',
      'ownerAvatarUrl',
      'createdAt',
      'language',
    ],
    where: {
      id: {
        [Op.in]: filteredProjectIds,
      },
    },
  });
  // github project info map
  const githubProjectMap = new Map<number, GithubProjects>();
  projectInfo.forEach(project => githubProjectMap.set(project.id, project));
  for (const result of currentResult) {
    const projectId = result.projectId;
    const project = githubProjectMap.get(projectId);

    const projectData: unknown = {
      currentRank: result.rank,
      previousRank: previousMap.get(projectId)?.rank,
      increasedValue: result.increasedValue,
      totalValue: result.totalValue,
      name: project?.fullName,
      logo: project?.ownerAvatarUrl,
      htmlUrl: project?.htmlUrl,
      description: project?.description,
      programmingLanguage: project?.language,
      createdAt: simpleDateFormat(dayjs(project?.createdAt)),
    };

    tableData.push(projectData);
  }
  const headers = getTableHeader(previousDate, curDate, dateType);
  page.data = { data: tableData, headers: Object.fromEntries(headers) } as any;
  return page;
}

/**
 * Retrieves the current and previous dates based on the specified date type.
 * 2024-09-24 change: use databse date
 *
 * @param dateType - The type of date to determine the current and previous dates.
 *   - DATE_TYPE.WEEK: Retrieves the current and previous Mondays.
 *   - DATE_TYPE.MONTH: Retrieves the first day of the current and previous months.
 *   - DATE_TYPE.YEAR: Retrieves the first day of the current and previous years.
 *
 * @param dataType
 * @returns An object containing the current and previous dates.
 */
async function getDatabaseDateByType(
  dateType: number,
  dataType: number,
): Promise<{ current: Dayjs; previous: Dayjs }> {
  // get newest trend date
  const { date } =
    (await TrendHistory.findOne({
      where: {
        dateType,
        dataType,
      },
      attributes: ['date'],
      order: [['date', 'desc']],
      offset: 0,
      limit: 1,
    })) || {};
  if (!date) {
    throw new Error('trend date not found');
  }
  const dayJsDate = dayjs(date);
  switch (dateType) {
    case DATE_TYPE.WEEK: {
      return { current: mondayOfCurrentWeek(dayJsDate), previous: mondayOfPreviousWeek(dayJsDate) };
    }
    case DATE_TYPE.MONTH: {
      return {
        current: firstDayOfCurrentMonth(dayJsDate),
        previous: firstDayOfPreviousMonth(dayJsDate),
      };
    }
    // Every year's first day to the current time
    case DATE_TYPE.YEAR: {
      return {
        current: dayJsDate,
        previous: firstDayOfCurrentYear(dayJsDate),
      };
    }
  }
}

/**
 * Retrieves the headers for the ranking table based on the current and previous dates.
 *
 * @param previousDate - The date representing the previous period.
 * @param curDate - The date representing the current period.
 * @param dateType - The type of date used to format the headers (e.g., week, month, year).
 *
 * @returns A Map containing the header names for the ranking table.
 */
function getTableHeader(
  previousDate: Dayjs,
  curDate: Dayjs,
  dateType: number,
): Map<string, string> {
  const headers: Map<string, string> = new Map<string, string>();
  const currentFormat = getDateDisplay(curDate, dateType);
  let currentHeaderName = '';
  switch (dateType) {
    case DATE_TYPE.WEEK: {
      currentHeaderName = `${currentFormat}`;
      break;
    }
    case DATE_TYPE.MONTH: {
      currentHeaderName = `${currentFormat}`;
      break;
    }
    case DATE_TYPE.YEAR: {
      currentHeaderName = `${currentFormat}`;
      break;
    }
  }
  headers.set('currentRank', currentHeaderName);
  headers.set('name', '名称');
  headers.set('programmingLanguage', '编程语言');
  headers.set('description', '描述');
  headers.set('createdAt', '创建时间');
  headers.set('increasedValue', '增长量');
  headers.set('totalValue', '总量');
  return headers;
}

/**
 * Formats the given date based on the specified date type.
 *
 * @param date - The date to format, represented as a Dayjs object.
 * @param dateType - The type of date to determine the formatting style.
 *   - DATE_TYPE.WEEK: Formats the date as a week.
 *   - DATE_TYPE.MONTH: Formats the date as a month (YYYY-MM).
 *   - DATE_TYPE.YEAR: Formats the date as a year (YYYY).
 *
 * @returns A formatted string representing the date based on the specified date type.
 */
function getDateDisplay(date: Dayjs, dateType: number) {
  switch (dateType) {
    case DATE_TYPE.WEEK: {
      return `${simpleWeekFormat(date)}`;
    }
    case DATE_TYPE.MONTH: {
      return `${date.format('YYYY-MM')}`;
    }
    case DATE_TYPE.YEAR: {
      return `${date.format('YYYY')}`;
    }
  }
}
/**
 * Retrieves the language filter condition for project filtering.
 *
 * @returns An object representing the language filter condition, including
 *          the value, label, and a list of programming languages as children.
 */
export function getLanguageFilterCondition(): { value: string; label: string }[] {
  return [
    { value: 'Python', label: 'Python' },
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'TypeScript', label: 'TypeScript' },
    { value: 'Java', label: 'Java' },
    { value: 'Go', label: 'Go' },
    { value: 'C++', label: 'C++' },
    { value: 'C', label: 'C' },
    { value: 'Rust', label: 'Rust' },
  ];
}

