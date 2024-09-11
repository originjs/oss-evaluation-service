import {
  GithubProjects,
  GithubProjectsHistory,
  GithubProjectsTable,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl, sleep } from '../util/util.js';
import { fetchWithRetries } from '../util/fetchWithRetries.js';
import { getAlllContributors } from './projectContributors.js';
import * as cheerio from 'cheerio';
import { storeGithubHistory } from './trendHistory.js';
import { Op } from 'sequelize';
import { isFirstDayOfMonth, isFirstDayOfWeek } from '../../util/day-js-util.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
dayjs.extend(utc);

export async function syncSingleProjectHistoryHandler(req, res) {
  const { repoUrl: repoUrl } = req.params;
  const project = await getProjectByUrl(repoUrl);
  await syncProjectHistory(project.id);
  res.status(200).send('success');
}

export async function syncAllProjectHistoryHandler(req, res) {
  await syncProjectHistory();
  res.status(200).send('success');
}

async function getProjectList(projectId) {
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl', 'fullName', 'contributors'],
    where: projectId
      ? {
          id: projectId,
        }
      : {},
  });
  return projectList;
}

async function getExistRecord(currentDate) {
  const existRecordList = await GithubProjectsHistory.findAll({
    where: {
      contributors: {
        [Op.ne]: null,
      },
      stars: {
        [Op.ne]: null,
      },
      date: currentDate,
    },
  }).catch(err => {
    logger.error('Error in query: ', err);
  });
  return existRecordList;
}

export async function syncHistoryByProjectList(projectList, currentDate) {
  const sumOfProject = projectList.length;
  logger.info(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    logger.info('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // get project information
    let [contributors, stars] = await getProjectInformation(project.htmlUrl);
    // API is called only if the GitHub page does not provide contributor information
    if (contributors === -1) {
      contributors = await getAlllContributors(project.fullName);
    }
    if (contributors) {
      logger.info(`GitHub API : contributors of ${project.htmlUrl} is ${contributors}`);
    }
    // check stars
    if (!stars) {
      stars = await getStars(project.fullName);
    }
    if (stars) {
      logger.info(`GitHub API : stars of ${project.htmlUrl} is ${stars}`);
    }
    if (!contributors && !stars) {
      continue;
    }
    // refresh github_projects_t
    await GithubProjectsTable.update(
      { contributors: contributors === -1 ? null : contributors },
      {
        where: {
          id: project.id,
        },
      },
    );
    // store github_projects_history
    await GithubProjectsHistory.upsert(
      {
        projectId: project.id,
        date: currentDate,
        contributors: contributors === -1 ? null : contributors,
        stars: stars,
      },
      {
        where: {
          projectId: project.id,
          date: currentDate,
        },
      },
    );
    await storeGithubHistory(project.id, currentDate);
  }
}

async function filterNotExistProject(projectId, currentDate) {
  const allProjectList = await getProjectList(projectId);
  const existRecordProjectIds = new Set((await getExistRecord(currentDate)).map(x => x.projectId));
  return allProjectList.filter(project => existRecordProjectIds.has(project.id));
}

export default async function syncProjectHistory(projectId) {
  const currentDate = new Date();
  for (let tryTimes = 0; tryTimes < 5; tryTimes++) {
    logger.info(`Sync Project History......Try Time: ${tryTimes + 1}`);
    const projectList = await filterNotExistProject(projectId, currentDate);
    if (projectList.length <= 0) {
      // integration finished
      break;
    }
    await syncHistoryByProjectList(projectList, currentDate);
    await sleep(3600 * 1000);
  }
}

async function getProjectInformation(url) {
  let contributors, stars;
  try {
    const response = await fetchWithRetries(url);
    if (response.ok) {
      const text = await response.text();
      // parse html
      const $ = cheerio.load(text);
      const repoName = url.match(/\/github\.com\/(.*)/)[1];
      // get contributor
      const content = $(`a[href="/${repoName}/graphs/contributors"]`).text();
      if (content.length === 0) {
        logger.info(`web crawler: ${url} does not provide contributors...`);
        contributors = -1;
      } else {
        const regex = /(\d{1,3}(,\d{3})*(\.\d+)?)/g;
        const contributorsArrays = content.match(regex);
        let contributorsNumMain, contributorsNumSub;
        contributorsNumMain = contributorsArrays[0]?.replace(/,/g, '');
        contributorsNumSub = contributorsArrays[1]?.replace(/,/g, '');
        // contributorsNumMain will be 5000 when it more than 5000, use contributorsNumSub to get realNumber
        let realNumber;
        if (contributorsNumMain === '5000') {
          realNumber = parseInt(contributorsNumSub) + 14;
        } else {
          realNumber = parseInt(contributorsNumMain);
        }
        contributors = realNumber.toString();

        logger.info(`web crawler: contributors of ${url} is ${contributors}`);
      }
      // get star
      const spanStar = $('#repo-stars-counter-star');
      if (!spanStar) {
        logger.info(`web crawler: ${url} does not provide stars...`);
      } else {
        const starValueOrigin = spanStar.attr('title');
        stars = starValueOrigin.replace(/,/g, '');
        logger.info(`web crawler: stars of ${url} is ${stars}`);
      }
    }
  } catch (e) {
    logger.error(`**web crawler: Url get contributors is failed !** :${url}`);
  }
  return [contributors, stars];
}

async function getStars(repoName) {
  const tokens = JSON.parse(process.env.GITHUB_TOKEN);
  const header = tokens
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens[0]}`,
      }
    : {
        'Content-Type': 'application/json',
      };

  const request = await fetchWithRetries(`https://api.github.com/repos/${repoName}`, {
    method: 'GET',
    headers: header,
  }).catch(error => logger.error('Error in fetch REST API:', error));
  // avoid situations where the project is empty
  try {
    const content = await request.json();
    return content.stargazers_count;
  } catch (error) {
    logger.error('The project is empty:', error);
    return null;
  }
}

export async function projectHistoryTimer() {
  logger.info('[Integration][ProjectHistory] Integration Job start');
  const startTime = process.hrtime();
  // It's only executed on the first day of the month or the first day of the week.
  const need2Run = isFirstDayOfWeek() || isFirstDayOfMonth();
  if (need2Run) {
    await syncProjectHistory();
    logger.info('[Integration][ProjectHistory] Integration Job end');
    const endTime = process.hrtime(startTime);
    logger.info(
      `[Integration][ProjectHistory] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
    );
  } else {
    logger.info(
      '[Integration][ProjectHistory] Integration Job stop because not Monday or the first day of the month.',
    );
  }
}
