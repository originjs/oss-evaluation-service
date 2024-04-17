import { GithubProjects, GithubProjectsStargazersTrend } from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';
import debug from 'debug';

export async function syncStargazersTrend(req, res) {
  await getStargazersTrend();
  res.status(200).json('ok');
}

async function getStargazersTrend() {
  const needSyncProject = await GithubProjects.findAll({
    order: [['stargazers_count', 'desc']],
    limit: 200,
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
      resTrend.push({
        projectId: project.id,
        name: project.name,
        fullName: project.fullName,
        htmlUrl: project.htmlUrl,
        stargazers: trend.stargazers,
        date: trend.date,
      });
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
      for (let res of resTrend) {
        await GithubProjectsStargazersTrend.upsert(res);
      }
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
