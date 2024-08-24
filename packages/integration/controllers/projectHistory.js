import {
  GithubProjects,
  GithubProjectsHistory,
  sequelize,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';

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

export async function projectContributorsHistoryTimer() {
  const startStoreTime = process.hrtime();
  logger.info('[Integration][ProjectContributorsHistory] Integration Job start');
  await storeProjectContributors();
  logger.info('[Integration][ProjectContributorsHistory] Integration Job end');
  const endStoreTime = process.hrtime(startStoreTime);
  logger.info(
    `[Integration][ProjectContributorsHistory] The total time spent on integration : ${endStoreTime[0]}s ${endStoreTime[1] / 1e6}ms`,
  );
}
