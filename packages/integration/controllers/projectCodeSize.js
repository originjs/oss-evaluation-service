import { ViewProjects, GithubProjectsTable, logger } from '@orginjs/oss-evaluation-data-model';
import * as cheerio from 'cheerio';
import { Op } from 'sequelize';
import { fetchWithTimeout } from '../util/fetchWitTimeout.js';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';

export async function syncProjectCodeSizeByPIdsHandler(req, res) {
  const pIds = req.body;
  await syncProjectCodeSize(pIds);
  res.status(200).send('success');
}

export async function syncAllProjectCodeSizeHandler(req, res) {
  await syncProjectCodeSize();
  res.status(200).send('success');
}

async function updateCodeSizeByPId(codeLines, pId) {
  if (codeLines && pId) {
    await GithubProjectsTable.update(
      { codeSize: codeLines },
      {
        where: {
          pId,
        },
      },
    );
  }
}

async function syncProjectCodeSize(pIds) {
  logger.info('Sync Project Code Size');
  const projectList = await ViewProjects.findAll({
    attributes: [
      'pId',
      'size',
      'cloneUrl',
      'ownerName',
      'name',
      'codeSize',
      'fullName',
      'platformType',
    ],
    where:
      pIds?.length > 0
        ? {
            pId: {
              [Op.in]: pIds,
            },
          }
        : {
            codeSize: {
              [Op.is]: null,
            },
          },
  });
  logger.info(`The Number of Project : ${projectList.length}`);
  for (let i = 0; i < projectList.length; i++) {
    await getCodeSizeByProject(projectList[i]);
    logger.info('**Current Progress**: ', `${i + 1}/${projectList.length}`);
  }
}

export async function getCodeSizeByProject(project) {
  const numOfM = project.size / 1024;
  let codeLines = null;
  if (numOfM < 5) {
    codeLines = await getCodeSizeBelow5M(project);
  } else if (numOfM < 500) {
    codeLines = await getCodeSizeBelow500M(project);
  }

  if (codeLines) {
    await updateCodeSizeByPId(codeLines, project.pId);
  } else if (numOfM < 1024) {
    // api failed , try to use cloc to get the codeLines
    await getCodeSizeUsingCloc(project);
  } else {
    logger.warn(`project ${project.fullName} code size is too large, skip`);
  }
}

async function getCodeSizeUsingCloc(project) {
  const repoServiceUrl = process.env.REPO_SERVICE_URL;
  if (!repoServiceUrl) {
    logger.warn('no ${REPO_SERVICE_URL} env config, skip local repo cloc');
    return;
  }
  const [owner, repoName] = project.fullName.split('/');
  const response = await fetch(`${repoServiceUrl}/repo/getCodeSize`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pId: project.pId,
      owner,
      repoName,
      platformType: project.platformType,
    }),
  });
  if (!response.ok) {
    logger.error(
      `request failed of get project:${project.fullName} cloc code size,error: ${await response.text()}`,
    );
  }
}

async function getCodeSizeBelow5M(project) {
  const fullName = project.fullName;
  const url = `https://git-cloc.fly.dev/cloc/${fullName}`;
  try {
    const response = await fetchWithTimeout(url, 3 * 60 * 1000);
    if (response.ok) {
      const text = await response.text();
      // parse html
      const $ = cheerio.load(text);
      const codeCell = $('#cloc-table > thead > tr > th').filter((_, th) => {
        return $(th).text() === 'Code';
      });
      const footCells = $('#cloc-table > tfoot > tr > th');
      return footCells.eq(codeCell.index()).text().replaceAll(',', '');
    }
  } catch (e) {
    logger.error(`get code size of ${project.fullName} failed!`, e);
  }
}

async function getCodeSizeBelow500M(project) {
  const fullName = project.fullName;
  const url = `https://api.codetabs.com/v1/loc?github=${fullName}`;
  try {
    const reponse = await fetchWithTimeout(url, 3 * 60 * 1000);
    if (reponse.ok) {
      const json = await reponse.json();
      return json.find(item => item.language === 'Total').linesOfCode;
    }
  } catch (e) {
    logger.error(`get code size of ${project.fullName} failed!`, e);
  }
}

export async function projectCodeSizeScheduler() {
  const startTime = process.hrtime();
  logger.info('[Integration][ProjectCodeSize] Integration Job start');
  await syncProjectCodeSize();
  logger.info('[Integration][ProjectCodeSize] Integration Job end');
  const endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][ProjectCodeSize] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}

// Add monitoring to all task functions in your scheduled task
export const projectCodeSizeTimer = addMonitoringToTask(
  projectCodeSizeScheduler,
  'projectCodeSizeTimer',
  'projectCodeSizeTimer',
);
