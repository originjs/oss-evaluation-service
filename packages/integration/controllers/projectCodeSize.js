import { GithubProjects, GithubProjectsTable, logger } from '@orginjs/oss-evaluation-data-model';
import * as cheerio from 'cheerio';
import { Op } from 'sequelize';
import { fetchWithTimeout } from '../util/fetchWitTimeout.js';

export async function syncProjectCodeSizeByProjectIdHandler(req, res) {
  const projectIds = req.body;
  await syncProjectCodeSize(projectIds);
  res.status(200).send('success');
}

export async function syncAllProjectCodeSizeHandler(req, res) {
  await syncProjectCodeSize();
  res.status(200).send('success');
}

async function updateCodeSizeByProjectId(codeLines, projectId) {
  if (codeLines && projectId) {
    await GithubProjectsTable.update(
      { codeSize: codeLines },
      {
        where: {
          id: projectId,
        },
      },
    );
  }
}
export async function setCodeSizeOfProject(req, res) {
  const { projectId, codeLines } = req.body;
  await updateCodeSizeByProjectId(codeLines, projectId);
  res.status(200);
  res.json({ ok: true });
}

async function syncProjectCodeSize(projectIds) {
  logger.info('Sync Project Code Size');
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'size', 'cloneUrl', 'ownerName', 'name', 'codeSize', 'fullName'],
    where:
      projectIds?.length > 0
        ? {
            id: {
              [Op.in]: projectIds,
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
    await updateCodeSizeByProjectId(codeLines, project.id);
  } else {
    // api failed , try to use cloc to get the codeLines
    await getCodeSizeUsingCloc(project);
  }
}

async function getCodeSizeUsingCloc(project) {
  const repoServiceUrl = process.env.REPO_SERVICE_URL;
  if (!repoServiceUrl) {
    logger.error('no ${REPO_SERVICE_URL} env config, skip local repo cloc');
    return;
  }
  const response = await fetch(`${repoServiceUrl}/repo/getCodeSize`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId: project.id,
      owner: project.ownerName,
      repoName: project.name,
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
    const response = await fetchWithTimeout(url, 10 * 1000);
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
    const reponse = await fetchWithTimeout(url, 60 * 1000);
    if (reponse.ok) {
      const json = await reponse.json();
      return json.find(item => item.language === 'Total').linesOfCode;
    }
  } catch (e) {
    logger.error(`get code size of ${project.fullName} failed!`, e);
  }
}

export async function projectCodeSizeTimer() {
  const startTime = process.hrtime();
  logger.info('[Integration][ProjectCodeSize] Integration Job start');
  await syncProjectCodeSize();
  logger.info('[Integration][ProjectCodeSize] Integration Job end');
  const endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][ProjectCodeSize] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}
