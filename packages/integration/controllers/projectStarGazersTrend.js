import { GithubProjects, GithubProjectsStargazersTrend } from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';
import sequelize from '../util/database.js';
import debug from 'debug';
import { getProjectByUrl } from '../util/util.js';

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
 * @param {{startDate: *}} options
 * @param {string} [options.beginDate]  integrate  begin date
 */
async function syncSingleProjectStargazersTrend(project, options) {
  await getStargazersTrend(options.startDate, project.id, project.id);
}

async function getStargazersTrend(startDate, startId, endId) {
  const needSyncProject = await sequelize.query(QUERY_SQL, {
    replacements: { startDate, startId, endId },
    type: sequelize.QueryTypes.SELECT,
  });

  for (let project of needSyncProject) {
    const response = await sendRequestByFullName(project.fullName);
    const trendList = response.data.rows;
    let resTrend = [];
    if (trendList === null || trendList === undefined || trendList.length === 0) {
      debug.log('sync error! project:{}  fullName{}', project.id, project.fullName);
      continue;
    }
    for (let trend of trendList) {
      if (trend.date >= startDate) {
        resTrend.push({
          projectId: project.id,
          name: project.name,
          fullName: project.fullName,
          htmlUrl: project.htmlUrl,
          stargazers: trend.stargazers,
          date: trend.date,
        });
      }
    }
    debug.log(
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

export async function sendRequestByFullName(fullName) {
  debug.log(`https://api.ossinsight.io/v1/repos/${fullName}/stargazers/history`);
  const response = await fetch(
    `https://api.ossinsight.io/v1/repos/${fullName}/stargazers/history`,
    {
      retryOptions: {
        retryMaxDuration: 7200000, // 120 min retry duration
        retryInitialDelay: 100,
      },
    },
  );
  if (response.ok) {
    return response.json();
  }
  return {
    error: `fetch Stargazers Trend failed:: ${response.statusText}`,
  };
}
