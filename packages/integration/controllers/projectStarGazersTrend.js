import {
  GithubProjects,
  GithubProjectsStargazersTrend,
  logger,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';
import { getProjectByUrl } from '../util/util.js';
import dayjs from 'dayjs';

const starHistoryUrl = 'https://api.ossinsight.io/q/analyze-stars-history?repoId=:projectId';

const QUERY_SQL = `
select distinct project.id,
                project.name,
                project.full_name as fullName,
                project.html_url  as htmlUrl,
                project_id        as projectId
from github_projects project
         left join (select *
                    from github_projects_stargazers_trend
                    where date >= :startDate) trend on project.id = project_id
where isnull(project_id)
  and project.id >= :startId
  and project.id <= :endId
order by id;
`;

export async function githubStargazersTrendTimer() {
  let startDate = dayjs().format('YYYY-MM-DD');
  let startTime = process.hrtime();
  logger.info('[Integration][GithubStargazersTrend] GithubStargazersTrend Integration Job start');
  await syncAllProjectStargazersTrend({ startDate });
  logger.info('[Integration][GithubStargazersTrend] GithubStargazersTrend integration Successful!');
  let endTime = process.hrtime(startTime);
  logger.info(
    `[Integration] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}

export async function syncAllProjectStargazersTrendHandler(req, res) {
  const { startDate } = req.body;
  await syncAllProjectStargazersTrend({ startDate });
  res.status(200).json('ok');
}

export async function syncSingleProjectStargazersTrendHandler(req, res) {
  const { startDate, repoUrl } = req.body;
  const project = await getProjectByUrl(repoUrl);
  await syncSingleProjectStargazersTrend(project, { startDate });
  res.status(200).json('ok');
}

/**
 * syncAllProjectStargazersTrend
 *
 * @param {{startDate: *}} options
 * @param {string} [options.beginDate]  integrate  begin date
 */
async function syncAllProjectStargazersTrend(options) {
  const maxId = await GithubProjects.max('id');
  const minId = await GithubProjects.min('id');
  await getStargazersTrend(options.startDate, minId, maxId);
}

/**
 * syncSingleProjectStargazersTrend
 *
 * @param {project} project info
 * @param {{objcet}} options
 * @param {string} [options.startDate]  integrate  begin date
 */
export async function syncSingleProjectStargazersTrend(project, options) {
  options = options ?? {};
  if (!options.startDate) {
    options.startDate = '1010-01-01';
  }
  await getStargazersTrend(options.startDate, project.id, project.id);
}

async function getStargazersTrend(startDate, startId, endId) {
  const needSyncProject = await sequelize.query(QUERY_SQL, {
    replacements: { startDate, startId, endId },
    type: sequelize.QueryTypes.SELECT,
  });

  for (let project of needSyncProject) {
    const response = await sendRequestByFullName(project.id);
    const trendList = response.data;
    let resTrend = [];
    if (trendList === null || trendList === undefined || trendList.length === 0) {
      logger.info('sync error! project:{}  fullName{}', project.id, project.fullName);
      continue;
    }
    for (let trend of trendList) {
      if (trend.event_month >= startDate) {
        resTrend.push({
          projectId: project.id,
          name: project.name,
          fullName: project.fullName,
          htmlUrl: project.htmlUrl,
          stargazers: trend.total,
          date: trend.event_month,
        });
      }
    }
    if (trendList.length >= 4) {
      const addedStars =
        trendList[trendList.length - 1].total - trendList[trendList.length - 4].total;
      sequelize.query(
        `UPDATE oss_evaluation_summary SET star_rate = ${addedStars} WHERE project_id = ${project.id}`,
      );
    }

    logger.info(
      'total:' +
        needSyncProject.length +
        ' cur:' +
        resTrend.length +
        ' project:' +
        project.fullName,
    );
    if (resTrend.length > 0) {
      await GithubProjectsStargazersTrend.bulkCreate(resTrend);
    }
  }
}

export async function sendRequestByFullName(projectId) {
  const url = starHistoryUrl.replace(':projectId', projectId);
  logger.info(url);
  const response = await fetch(url, {
    retryOptions: {
      retryMaxDuration: 7200000, // 120 min retry duration
      retryInitialDelay: 100,
    },
  });
  if (response.ok) {
    return response.json();
  }
  return {
    error: `fetch Stargazers Trend failed:: ${response.statusText}`,
  };
}
