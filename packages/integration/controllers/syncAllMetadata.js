import { syncSingleGithubProject } from './github.js';
import { getProjectByUrl } from '../util/util.js';
import { syncSingleProjectCncfDocumentScore } from './documentScore.js';
import { syncSingleProjectStargazersTrend } from './projectStarGazersTrend.js';
import { syncSingleProjectOpendigger } from './opendigger.js';
import { getCodeSizeByProject } from './projectCodeSize.js';
import { syncSingleProjectContributors } from './projectContributors.js';
import { syncSingleProjectDependentCount } from './projectDependentCount.js';
import {
  CriticalityScore,
  GithubProjects,
  logger,
  ProjectPackage,
  ProjectTechStack,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import { syncSingleProjectPackageDownloadCount } from './downloadCount.js';
import dayjs from 'dayjs';
import { syncSingleProjectPackageSize } from './packageSize.js';
import { syncSingleProjectEvaluation } from './evaluate.js';
import { syncSingleProjectScorecardByProject } from './scorecard.js';
import { syncSingleProjectCompassMetric } from './compass.js';
import { syncSingleProjectDependencies } from './projectDependencies.js';
import { syncSingleProjectCreatorsCountries } from './ossinsightCreatorsCountry.js';
import { syncSingleProjectCreatorsOrg } from './ossinsightCreatorsOrg.js';

export default async function syncSingleProjectAllMetadataHandler(req, res) {
  const options = req.body;
  await syncSingleProjectAllMetadata(options);
  res.status(200).send(`Project Integration Successful!: ${options.repoUrl}`);
}

export async function syncBatchProjectAllMetadataHandler(req, res) {
  const projectList = await getBatchProject();
  let count = 1;
  for (const project of projectList) {
    logger.info(
      `[Batch Integration Process] Process: ${count} / ${projectList.length}, project: ${project.html_url}`,
    );
    await syncSingleProjectAllMetadata({ repoUrl: project.html_url });
    count += 1;
  }
  logger.info(`[Batch Integrated], total project: ${projectList.length}`);
  res.status(200).send('Batch project integrate success');
}

export async function syncBatchProjectAllMetadataByRepoUrlsHandler(req, res) {
  const htmlUrls = req.body;
  if (!htmlUrls?.length) {
    res.status(200);
    res.send('empty repoUrl');
  }
  for (let i = 0; i < htmlUrls.length; i++) {
    const htmlUrl = htmlUrls[i];
    logger.info(
      `[Batch Integration Process] Process: ${i + 1} / ${htmlUrls.length}, url: ${htmlUrl}`,
    );
    await syncSingleProjectAllMetadata({ repoUrl: htmlUrl });
  }
  res.status(200);
  res.send('success');
}

export async function syncBatchProjectAllMetadataByProjectIdsHandler(req, res) {
  const projectIds = req.body;
  if (!projectIds?.length) {
    res.status(200);
    res.send('empty projectId');
  }
  for (let i = 0; i < projectIds.length; i++) {
    const projectId = projectIds[i];
    logger.info(
      `[Batch Integration Process] Process: ${i + 1} / ${projectIds.length}, projectId: ${projectId}`,
    );
    const project = await GithubProjects.findOne({
      where: {
        id: projectId,
      },
    });
    if (project) {
      await syncSingleProjectAllMetadata({ repoUrl: project.htmlUrl});
    }
  }
  res.status(200);
  res.send('success');
}

async function syncSingleProjectAllMetadata(options) {
  const { repoUrl, category, subcategory, packageName } = options;
  // 1. GitHub Info
  await syncSingleGithubProject({ url: repoUrl });
  const project = await getProjectByUrl(repoUrl);
  if (!project) {
    logger.error(`[Batch Integrated] get github info by repo:{${repoUrl}} failed!!`);
    return;
  }

  // 2. insert techStack
  if (category && subcategory) {
    await createNewTechStack(repoUrl, category, subcategory);
  }
  // try ... catch to avoid break
  const functions = [
    // 3. Cncf document best practice
    syncSingleProjectCncfDocumentScore,
    // 4. GitHub star trend
    syncSingleProjectStargazersTrend,
    // 5. openrank & opendigger
    syncSingleProjectOpendigger,
    // 6. code size、 contributor count、 dependent count
    getCodeSizeByProject,
    syncSingleProjectContributors,
    syncSingleProjectDependentCount,
    // 7. critical score
    createNewCriticalityScore,
    // 8. scorecard
    syncSingleProjectScorecardByProject,
    // 10. compass  -> manual
    syncSingleProjectCompassMetric,
    // 11. sonarCloud -> manual
    // 12. sync project dependency graph
    syncSingleProjectDependencies,
    // 13. oss-insight geology/companies data
    syncSingleProjectCreatorsCountries,
    syncSingleProjectCreatorsOrg,
    // 14. Evaluate the score
    syncSingleProjectEvaluation,
  ];

  for (const _function of functions) {
    try {
      await _function(project);
    } catch (e) {
      logger.error(`[Batch Integrated] integration function:{${_function.name}} error`, e);
    }
  }

  // 9. Determining the type of software: frontend software - main package / Rust - Cargo and so on
  if (packageName) {
    logger.info('Front-end software, computing package related data');
    // 9.1 insert main package project_packages: rule is manual
    await ProjectPackage.upsert({
      projectId: project.id,
      projectName: project.fullName,
      package: packageName,
      mainPackage: 1,
      mainPackageFreshType: 'manual',
    });
    // 9.2 package download count
    let startDate = '2024-01-01';
    let endDate = new dayjs().format('YYYY-MM-DD');
    await syncSingleProjectPackageDownloadCount(project, { startDate, endDate });
    // 9.3 package size
    await syncSingleProjectPackageSize(project);
  }
  logger.info(`Project ${repoUrl}: all metadata information integrated`);
}

async function createNewTechStack(repoUrl, category, subcategory) {
  const project = await GithubProjects.findOne({
    where: {
      html_url: repoUrl,
    },
  });
  if (project === null) {
    logger.info('Project not exist, please create project first');
    return;
  }

  await ProjectTechStack.upsert({
    projectId: project.id,
    name: project.name,
    htmlUrl: repoUrl,
    category,
    subcategory,
  });
}

async function createNewCriticalityScore(project) {
  // ： criticality_score_20240401
  const QUERY_SQL = `
select default_score, collection_date
from criticality_score_20240401 cs
where cs.url = :repoUrl
`;
  const newCriticalityScore = await sequelize.query(QUERY_SQL, {
    replacements: { repoUrl: project.htmlUrl },
    type: sequelize.QueryTypes.SELECT,
  });
  if (newCriticalityScore.length === 0) {
    logger.info(`Criticality Score for project: ${project.htmlUrl} does not exist`);
    return;
  }
  // criticality_score
  await CriticalityScore.upsert({
    projectId: project.id,
    projectName: project.name,
    repoUrl: project.htmlUrl,
    score: newCriticalityScore.defaultScore,
    collectionDate: newCriticalityScore.collectionDate,
  });
}

async function getBatchProject() {
  // criticality_score_20240401
  const QUERY_SQL = `SELECT *  from github_projects limit 100`;
  return await sequelize.query(QUERY_SQL, {
    type: sequelize.QueryTypes.SELECT,
  });
}
