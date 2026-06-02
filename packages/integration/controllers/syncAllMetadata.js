import { syncSingleProject } from './project.js';
import { syncSingleProjectCncfDocumentScore } from './documentScore.js';
import { syncSingleProjectStargazersTrend } from './projectStarGazersTrend.js';
import { syncSingleProjectOpendigger } from './opendigger.js';
import { getCodeSizeByProject } from './projectCodeSize.js';
import { syncSingleProjectContributors } from './projectContributors.js';
import { syncSingleProjectDependentCount } from './projectDependentCount.js';
import {
  CriticalityScore,
  ViewProjects,
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
import { syncSingleProjectAlternative, updateProjectId } from './alternative.js';
import { syncSingleProjectDescription } from './projectDescription.js';

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

export async function syncBatchProjectAllMetadataByPIdsHandler(req, res) {
  const pIds = req.body;
  if (!pIds?.length) {
    res.status(200);
    res.send('empty pIds');
  }
  for (let i = 0; i < pIds.length; i++) {
    const pId = pIds[i];
    logger.info(`[Batch Integration Process] Process: ${i + 1} / ${pIds.length}, pId: ${pId}`);
    const project = await ViewProjects.findOne({
      where: {
        pId,
      },
    });
    if (project) {
      await syncSingleProjectAllMetadata({ repoUrl: project.htmlUrl });
    }
  }
  res.status(200);
  res.send('success');
}

async function syncSingleProjectAllMetadata(options) {
  const { repoUrl, category, subcategory, packageName } = options;
  // 1. Project Info
  const project = await syncSingleProject({ url: repoUrl });
  if (!project) {
    logger.error(`[Batch Integrated] get project info by repo:{${repoUrl}} failed!!`);
    return;
  }
  project.pId = `${project.platformType}#${project.id}`;

  // 2. insert techStack
  if (category && subcategory) {
    await createNewTechStack(project.pId, category, subcategory);
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
    // 9. compass -> manual
    syncSingleProjectCompassMetric,
    // 10. sync project dependency graph
    syncSingleProjectDependencies,
    // 11. oss-insight geology/companies data
    syncSingleProjectCreatorsCountries,
    syncSingleProjectCreatorsOrg,
    // 12. Evaluate the score
    syncSingleProjectEvaluation,
    // 13. AI project alternative
    syncSingleProjectAlternative,
    // 14. AI project description
    syncSingleProjectDescription,
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
      pId: project.pId,
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

  // 15.1 update project id
  await updateProjectId();

  logger.info(`Project ${repoUrl}: all metadata information integrated`);
}

async function createNewTechStack(pId, category, subcategory) {
  const project = await ViewProjects.findOne({
    where: {
      pId,
    },
  });
  if (project === null) {
    logger.info('Project not exist, please create project first');
    return;
  }

  await ProjectTechStack.upsert({
    pId: project.pId,
    name: project.name,
    fullName: project.fullName,
    htmlUrl: project.htmlUrl,
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
    pId: project.pId,
    projectName: project.name,
    repoUrl: project.htmlUrl,
    score: newCriticalityScore.defaultScore,
    collectionDate: newCriticalityScore.collectionDate,
  });
}

async function getBatchProject() {
  // criticality_score_20240401
  const QUERY_SQL = `SELECT *
                     from view_projects
                     limit 100`;
  return await sequelize.query(QUERY_SQL, {
    type: sequelize.QueryTypes.SELECT,
  });
}
