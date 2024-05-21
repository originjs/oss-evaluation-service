import { syncSingleGithubProject } from './github.js';
import { getProjectByUrl } from '../util/util.js';
import { syncSingleProjectCncfDocumentScore } from './documentScore.js';
import { syncSingleProjectStargazersTrend } from './projectStarGazersTrend.js';
import { syncSingleProjectOpendigger } from './opendigger.js';
import { syncSingleProjectCodeSize } from './projectCodeSize.js';
import { syncSingleProjectContributors } from './projectContributors.js';
import { syncSingleProjectDependentCount } from './projectDependentCount.js';
import {
  CriticalityScore,
  GithubProjects,
  ProjectPackage,
  ProjectTechStack,
} from '@orginjs/oss-evaluation-data-model';
import { syncSingleProjectPackageDownloadCount } from './downloadCount.js';
import dayjs from 'dayjs';
import { syncSingleProjectPackageSize } from './packageSize.js';
import sequelize from '@orginjs/oss-evaluation-data-model/util/database.js';
import { syncSingleProjectEvaluation } from './evaluate.js';

export default async function syncSingleProjectAllMetadataHandler(req, res) {
  const options = req.body;
  await syncSingleProjectAllMetadata(options);
  res.status(200).send(`Project Integration Successful!: ${options.repoUrl}`);
}

async function syncSingleProjectAllMetadata(options) {
  const { repoUrl, category, subcategory, packageName } = options;
  // 1. GitHub Info
  await syncSingleGithubProject({ url: repoUrl });
  // 2. insert techStack
  await createNewTechStack(repoUrl, category, subcategory);
  // 3. Cncf document best practice
  const project = await getProjectByUrl(repoUrl);
  await syncSingleProjectCncfDocumentScore(project);
  // 4. GitHub star trend
  await syncSingleProjectStargazersTrend(project, { startDate: '1010-01-01' });
  // 5. openrank & opendigger
  await syncSingleProjectOpendigger(project);
  // 6. code size、 contributor count、 dependent count
  await syncSingleProjectCodeSize(project);
  await syncSingleProjectContributors(project);
  await syncSingleProjectDependentCount(project);
  // 7. critical score
  await createNewCriticalityScore(project);
  // 8. scorecard
  // 9. Determining the type of software: frontend software - main package / Rust - Cargo and so on
  if (packageName !== '') {
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
  // 10. compass  -> manual
  // 11. sonarCloud -> manual
  // 12. Evaluate the score
  await syncSingleProjectEvaluation(project);
}

async function createNewTechStack(repoUrl, category, subcategory) {
  const project = await GithubProjects.findOne({
    where: {
      html_url: repoUrl,
    },
  });
  if (project == null) {
    console.log('Project not exist, please create project id first');
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
    console.log(`Criticality Score for project: ${project.htmlUrl} does not exist`);
    return;
  }
  //插入或更新到状态表：criticality_score
  await CriticalityScore.upsert({
    projectId: project.id,
    projectName: project.name,
    repoUrl: project.htmlUrl,
    score: newCriticalityScore.defaultScore,
    collectionDate: newCriticalityScore.collectionDate,
  });
}
