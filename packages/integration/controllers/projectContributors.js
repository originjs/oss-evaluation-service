import { ViewProjects, logger, UnifiedProjects } from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl, getValidToken, refreshValidToken } from '../util/util.js';
import { fetchWithTimeout } from '../util/fetchWitTimeout.js';
import { fetchWithRetries } from '../util/fetchWithRetries.js';
import * as cheerio from 'cheerio';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';
import { platformTypes } from '@orginjs/oss-evaluation-util';

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

/**
 * Synchronize Single Project Contributors
 * @param {Object} project project info
 * @returns {Promise<*>} inserted project contributors
 */
export async function syncSingleProjectContributors(project) {
  await syncProjectContributors(project.pId);
}

export async function syncAllProjectContributors() {
  await syncProjectContributors();
}

async function getProjectList(pId) {
  const projectList = await ViewProjects.findAll({
    attributes: ['pId', 'platformType', 'htmlUrl', 'fullName', 'contributors'],
    where: pId
      ? {
          pId,
        }
      : {},
  });
  return projectList;
}

export default async function syncProjectContributors(pId) {
  logger.info('Sync Project Contributors');
  // 1. get all project
  const projectList = await getProjectList(pId);
  const sumOfProject = projectList.length;
  logger.info(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    logger.info('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. get project contributors
    let contributors = await getProjectContributors(project);
    if (!contributors) {
      contributors = await getAllContributors(project);
      logger.info(`Project API : contributors of ${project.htmlUrl} is ${contributors}`);
    }
    if (!contributors) {
      continue;
    }

    await UnifiedProjects.update(
      { contributors: contributors === -1 ? null : contributors },
      {
        where: {
          pId: project.pId,
        },
      },
    );
  }
}

const getGitcodeProjectContributors = async url => {
  let contributors;
  try {
    const response = await fetchWithTimeout(url, 3 * 60 * 1000);
    if (response.ok) {
      const text = await response.text();
      // parse html
      const $ = cheerio.load(text);
      contributors = $('.contributors-container').children().length;
      if (!contributors) {
        logger.info(`web crawler: ${url} does not provide contributors...`);
        return contributors;
      }

      logger.info(`web crawler: contributors of ${url} is ${contributors}`);
    }
  } catch (e) {
    logger.error(`**web crawler: Url get contributors is failed !** :${url}`);
  }
  return contributors;
};

const getGiteeProjectContributors = async url => {
  let contributors;
  try {
    const response = await fetchWithTimeout(url, 3 * 60 * 1000);
    if (response.ok) {
      const text = await response.text();
      // parse html
      const $ = cheerio.load(text);
      const content = $('.git-user-twl-col.project-contributors__container>.ui.header').text();
      if (content.length === 0) {
        logger.info(`web crawler: ${url} does not provide contributors...`);
        return contributors;
      }

      const regex = /.*\((\d+)\)/;
      const result = content.match(regex);
      if (result) {
        contributors = result[1];
      }

      logger.info(`web crawler: contributors of ${url} is ${contributors}`);
    }
  } catch (e) {
    logger.error(`**web crawler: Url get contributors is failed !** :${url}`);
  }
  return contributors;
};

const getGithubProjectContributors = async url => {
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
};

async function getProjectContributors(project) {
  let contributors;

  if (project.platformType === platformTypes.GITHUB) {
    contributors = await getGithubProjectContributors(project.htmlUrl);
  } else if (project.platformType === platformTypes.GITEE) {
    contributors = await getGiteeProjectContributors(`${project.htmlUrl}/contributors`);
  } else if (project.platformType === platformTypes.GITCODE) {
    contributors = await getGitcodeProjectContributors(`${project.htmlUrl}/contributors`);
  }

  return contributors;
}

async function getContributors(project, page = 1) {
  // only GitHub support page
  if (project.platformType !== platformTypes.GITHUB && page > 1) {
    return [];
  }

  const repoName = project.fullName;
  const token = await getValidToken(project.platformType);
  const header = {
    'Content-Type': 'application/json',
  };
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }
  const urlMap = {
    [platformTypes.GITHUB]: `https://api.github.com/repos/${repoName}/contributors?per_page=100&page=${page}&anon=true`,
    [platformTypes.GITEE]: `https://gitee.com/api/v5/repos/${repoName}/contributors?type=authors`,
    [platformTypes.GITCODE]: `https://api.gitcode.com/api/v5/repos/${repoName}/contributors/statistic`,
  };

  const request = await fetchWithRetries(urlMap[project.platformType], {
    method: 'GET',
    headers: header,
  }).catch(error => {
    logger.error('Error in fetch REST API:', error);
    return -1;
  });
  if (request.status === 403) {
    await refreshValidToken(project.platformType);
  }
  // avoid situations where the project is empty
  try {
    return await request.json();
  } catch (error) {
    logger.error('The project is empty:', error);
    return [];
  }
}

export async function getAllContributors(project) {
  let contributors = [];
  let page = 1;
  let list;
  do {
    list = await getContributors(project, page);
    // fetch API failed
    if (typeof list === 'number') {
      return -1;
    }
    contributors = contributors.concat(list);
    page++;
  } while (list.length > 0);

  if (project.platformType === platformTypes.GITHUB) {
    for (let i = 0; i < contributors.length; i++) {
      if (Object.hasOwn(contributors[i], 'email')) {
        contributors.splice(i, 1);
      }
    }
  }

  return contributors.length;
}

export async function projectContributorsScheduler() {
  const startTime = process.hrtime();
  logger.info('[Integration][ProjectContributors] Integration Job start');
  await syncAllProjectContributors();
  logger.info('[Integration][ProjectContributors] Integration Job end');
  const endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][ProjectContributors] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}

// Add monitoring to all task functions in your scheduled task
export const projectContributorsTimer = addMonitoringToTask(
  projectContributorsScheduler,
  'projectContributorsTimer',
  'projectContributorsTimer',
);
