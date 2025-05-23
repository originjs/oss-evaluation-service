import {
  ViewProjects,
  GithubProjectsStargazersTrend,
  logger,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';
import { getProjectByUrl } from '../util/util.js';
import dayjs from 'dayjs';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';
import { Sequelize } from 'sequelize';

const starHistoryUrl = 'https://api.ossinsight.io/q/analyze-stars-history?repoId=:pId';
const defaultDate = '1010-01-01';

const QUERY_SQL = `
    select distinct project.p_id,
                    project.name,
                    project.full_name as fullName,
                    project.html_url  as htmlUrl,
                    trend.p_id        as pId
    from view_projects project
             left join (select *
                        from github_projects_stargazers_trend
                        where date >= :startDate) trend on project.p_id = trend.p_id
    where isnull(trend.p_id)
      and project.p_id >= :startId
      and project.p_id <= :endId
    order by p_id;
`;

export async function githubStargazersTrendScheduler() {
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

// Add monitoring to all task functions in your scheduled task
export const githubStargazersTrendTimer = addMonitoringToTask(
  githubStargazersTrendScheduler,
  'githubStargazersTrendTimer',
  'githubStargazersTrendTimer',
);

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
  const maxId = await ViewProjects.max('pId');
  const minId = await ViewProjects.min('pId');
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
    options.startDate = defaultDate;
  }
  await getStargazersTrend(options.startDate, project.pId, project.pId);
}

async function getStargazersTrend(startDate, startId, endId) {
  const needSyncProject = await sequelize.query(QUERY_SQL, {
    replacements: { startDate, startId, endId },
    type: sequelize.QueryTypes.SELECT,
  });

  for (let project of needSyncProject) {
    const response = await sendRequestByFullName(project.pId);
    const trendList = response.data;
    let resTrend = [];
    if (trendList === null || trendList === undefined || trendList.length === 0) {
      logger.info('sync error! project:{}  fullName{}', project.pId, project.fullName);
      continue;
    }
    let maxDate = await getProjectMaxDate(project.fullName);
    for (let trend of trendList) {
      if (trend.event_month > maxDate) {
        resTrend.push({
          pId: project.pId,
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
        `UPDATE oss_evaluation_summary
         SET star_rate = ${addedStars}
         WHERE p_id = ${project.pId}`,
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

async function getProjectMaxDate(fullName) {
  const resTrend = await GithubProjectsStargazersTrend.findAll({
    attributes: [[Sequelize.fn('MAX', Sequelize.col('date')), 'maxDate']],
    where: {
      full_name: fullName,
    },
  });
  return resTrend[0].dataValues.maxDate == null ? defaultDate : resTrend[0].dataValues.maxDate;
}

export async function sendRequestByFullName(pId) {
  const url = starHistoryUrl.replace(':pId', pId);
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
