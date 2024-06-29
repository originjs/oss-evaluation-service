import { GithubProjects, GithubProjectsTable, logger } from '@orginjs/oss-evaluation-data-model';
import { Cron } from 'croner';
import { getProjectByUrl } from '../util/util.js';
import * as cheerio from 'cheerio';

export default async function syncSingleProjectCodeSizeHandler(req, res) {
  const { repoUrl: repoUrl } = req.params;
  const project = await getProjectByUrl(repoUrl);
  await syncSingleProjectCodeSize(project);
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

export async function syncAllProjectCodeSizeHandler(req, res) {
  await syncAllProjectCodeSize();
  res.status(200).send('success');
}

/**
 * Synchronize Single Project Code Size
 * @param {Object} project project info
 * @returns {Promise<*>} inserted project code size
 */
export async function syncSingleProjectCodeSize(project) {
  await syncProjectCodeSize(project.id);
}

export async function syncAllProjectCodeSize() {
  await syncProjectCodeSize();
}

async function syncProjectCodeSize(projectId) {
  logger.info('Sync Project Code Size');
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'size', 'cloneUrl', 'ownerName', 'name', 'codeSize', 'fullName'],
    where: projectId
      ? {
          id: projectId,
        }
      : {},
  });
  logger.info(`The Number of Project : ${projectList.length}`);
  for (let i = 0; i < projectList.length; i++) {
    logger.info('**Current Progress**: ', `${i + 1}/${projectList.length}`);
    const project = projectList[i];
    const numOfM = project.size / 1024;
    let codeLines = null;
    if (numOfM < 5) {
      codeLines = await getCodeSizeBelow5M(project);
    } else if (numOfM < 500) {
      codeLines = await getCodeSizeBelow500M(project);
    }

    if (codeLines) {
      await updateCodeSizeByProjectId(codeLines, projectId);
    } else {
      // api failed , try to use cloc to get the codeLines
      await getCodeSizeUsingCloc(project);
    }
  }
}

async function getCodeSizeUsingCloc(project) {
  const fetchUrl = process.env.REPO_SERVICE_URL;
  const response = await fetch(`${fetchUrl}/repo/getCodeSize`, {
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
    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      // parse html
      const $ = cheerio.load(text);
      const CodeCell = $('#cloc-table > thead > tr > th').filter((_, th) => {
        return $(th).text() === 'Code';
      });
      const footCells = $('#cloc-table > tfoot > tr > th');
      return footCells.eq(CodeCell.index()).text().replaceAll(',', '');
    }
  } catch (e) {
    logger.error(`get code size of ${project.fullName} failed!`, e);
  }
}

async function getCodeSizeBelow500M(project) {
  const fullName = project.fullName;
  const url = `https://api.codetabs.com/v1/loc?github=${fullName}`;
  try {
    const reponse = await fetch(url);
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
  await syncAllProjectCodeSize();
  logger.info('[Integration][ProjectCodeSize] Integration Job end');
  const endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][ProjectCodeSize] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}
