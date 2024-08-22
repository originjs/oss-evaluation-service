import {
  GithubProjects,
  GithubProjectsTable,
  GithubProjectsHistory,
  sequelize,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import { fetchWithTimeout } from '../util/fetchWitTimeout.js';
import * as cheerio from 'cheerio';

export async function syncSingleProjectContributorsHandler(req, res) {
  const { repoUrl: repoUrl } = req.params;
  const project = await getProjectByUrl(repoUrl);
  await syncSingleProjectContributors(project);
  res.status(200).send('success');
}

export async function syncAllProjectContributorsHandler(req, res) {
  await syncAllProjectContributors();
  res.status(200).send('success');
}

export async function storeSingleProjectContributorsHandler(req, res) {
  const { repoUrl: repoUrl } = req.params;
  const project = await getProjectByUrl(repoUrl);
  await storeProjectContributors(project.id);
  res.status(200).send('success');
}

export async function storeAllProjectContributorsHandler(req, res) {
  await storeProjectContributors();
  res.status(200).send('success');
}

/**
 * Synchronize Single Project Contributors
 * @param {Object} project project info
 * @returns {Promise<*>} inserted project contributors
 */
export async function syncSingleProjectContributors(project) {
  await syncProjectContributors(project.id);
}

export async function syncAllProjectContributors() {
  await syncProjectContributors();
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

export async function storeProjectContributors(projectId) {
  logger.info('Store Project Contributors');
  // 1. get all github project
  const projectList = await getProjectList(projectId);
  const sumOfProject = projectList.length;
  logger.info(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    logger.info('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. update project contributors
    const currentDate = sequelize.literal('CURDATE()');
    await GithubProjectsHistory.upsert(
      {
        projectId: project.id,
        date: currentDate,
        contributors: project.contributors ? project.contributors : 0,
      },
      {
        where: {
          projectId: project.id,
          date: currentDate,
        },
      },
    );
  }
}

export default async function syncProjectContributors(projectId) {
  logger.info('Sync Project Contributors');
  // 1. get all github project
  const projectList = await getProjectList(projectId);
  const sumOfProject = projectList.length;
  logger.info(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    logger.info('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. get project contributors
    let contributors = await getProjectContributors(project.htmlUrl);
    if (contributors == '' || contributors == undefined) {
      contributors = (await getAlllContributors(project.fullName)).length;
      logger.info(`GitHub API : contributors of ${project.htmlUrl} is ${contributors}`);
    }
    if (contributors == '' || contributors == undefined) {
      continue;
    }

    await GithubProjectsTable.update(
      { contributors: contributors },
      {
        where: {
          id: project.id,
        },
      },
    );
  }
}

async function getProjectContributors(url) {
  let contributors;
  try {
    const response = await fetchWithTimeout(url, 3 * 60 * 1000);
    if (response.ok) {
      const text = await response.text();
      // parse html
      const $ = cheerio.load(text);
      const repoName = url.match(/\/github\.com\/(.*)/)[1];
      const content = $(`a[href="/${repoName}/graphs/contributors"]`).text();
      if (content.length === 0) {
        logger.info(`web crawler: ${url} does not provide contributors...`);
        return contributors;
      }

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
  } catch (e) {
    logger.error(`**web crawler: Url get contributors is failed !** :${url}`);
  }
  return contributors;
}

async function getContributors(repoName, page = 1) {
  const header = process.env.GITHUB_TOKEN
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      }
    : {
        'Content-Type': 'application/json',
      };

  const request = await fetch(
    `https://api.github.com/repos/${repoName}/contributors?per_page=100&page=${page}&anon=true`,
    {
      method: 'GET',
      headers: header,
    },
  );

  // avoid situations where the project is empty
  return request.length > 0 ? await request.json() : [];
}

async function getAlllContributors(repoName) {
  let contributors = [];
  let page = 1;
  let list;
  do {
    list = await getContributors(repoName, page);
    contributors = contributors.concat(list);
    page++;
  } while (list.length > 0);
  for (let i = 0; i < contributors.length; i++) {
    if (Object.prototype.hasOwnProperty.call(contributors[i], 'email')) {
      contributors.splice(i, 1);
    }
  }
  return contributors;
}

export async function projectContributorsTimer() {
  const startTime = process.hrtime();
  logger.info('[Integration][ProjectContributors] Integration Job start');
  await syncAllProjectContributors();
  logger.info('[Integration][ProjectContributors] Integration Job end');
  const endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][ProjectContributors] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}

export async function projectContributorsHistoryTimer() {
  const startTime = process.hrtime();
  logger.info('[Integration][ProjectContributorsHistory] Integration Job start');
  await storeProjectContributors();
  logger.info('[Integration][ProjectContributorsHistory] Integration Job end');
  const endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][ProjectContributorsHistory] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}
