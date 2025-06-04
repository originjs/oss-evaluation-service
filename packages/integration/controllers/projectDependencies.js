import { gql, request } from 'graphql-request';
import { authorizationHeader } from '../../api-sdk/util.js';
import GithubSdk from '@orginjs/github-sdk';
import {
  ViewProjects,
  GithubProjectsDependencies,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { platformTypes } from '@orginjs/oss-evaluation-util';

const graphqlUrl = 'https://api.github.com/graphql';

const queryPackageName = gql`
  query ($repoOwner: String!, $repoName: String!) {
    repository(owner: $repoOwner, name: $repoName) {
      description
      dependencyGraphManifests(first: 100) {
        totalCount
        nodes {
          filename
          blobPath
          dependencies {
            totalCount
            nodes {
              packageName
              repository {
                name
                nameWithOwner
                owner {
                  login
                }
                isInOrganization
                primaryLanguage {
                  name
                }
              }
              requirements
              hasDependencies
            }
          }
        }
      }
    }
  }
`;

export async function syncSingleProjectDependenciesHandler(req, res) {
  const { repoUrl: repoUrl } = req.params;
  const project = await getProjectInfoByUrl(repoUrl);
  await syncSingleProjectDependencies(project);
  res.status(200).send('success');
}

export async function syncAllProjectDependenciesHandler(req, res) {
  await syncAllProjectDependencies();
  res.status(200).send('success');
}

/**
 * Synchronize Single Project Dependencies
 * @param {Object} project project info
 * @returns {Promise<*>} inserted project dependencies
 */
export async function syncSingleProjectDependencies(project) {
  await getDependencies(project, new Set());
}

export async function syncAllProjectDependencies() {
  logger.info('Sync Project Dependent');
  // 1. get all project
  const projectList = await ViewProjects.findAll({
    attributes: ['pId', 'ownerName', 'name', 'ownerType', 'id', 'platformType'],
  });
  const sumOfProject = projectList.length;
  logger.info(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    logger.info('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. project Dependent
    await getDependencies(project, new Set());
  }
}

export async function getDependencies(project, seen) {
  if (project.platformType !== platformTypes.GITHUB) {
    logger.warn(`project:${project.fullName} is not support, skip integrate dependencies!`);
    return;
  }
  let githubSdk = new GithubSdk();
  const headers = authorizationHeader(githubSdk.token);
  headers.append('Accept', 'application/vnd.github.hawkgirl-preview+json');

  const dependenciesData = await request(
    graphqlUrl,
    queryPackageName,
    {
      repoOwner: project.ownerName,
      repoName: project.name,
    },
    headers,
  ).catch(error => {
    logger.error('Post to dependencies error : ', error.message);
  });
  if (dependenciesData === undefined || !dependenciesData['repository']) {
    return;
  }
  const dependData = await parseDependenciesData(project, dependenciesData, seen);
  await softDeleteDependencies(project, dependData.dependFullNameList);
  await saveDate(dependData.dependenciesList);
}

async function softDeleteDependencies(project, dependFullNameList) {
  const dbDependencies = await GithubProjectsDependencies.findAll({
    where: {
      ownerName: project.ownerName,
      name: project.name,
    },
  });

  const deleteDependencies = [];
  for (const dependencies of dbDependencies) {
    if (!dependFullNameList.includes(dependencies.getDataValue('dependentFullName'))) {
      dependencies.setDataValue('deleted', 1);
      deleteDependencies.push(dependencies.dataValues);
    }
  }
  if (deleteDependencies.length < 0) {
    return;
  }
  await GithubProjectsDependencies.bulkCreate(deleteDependencies, {
    updateOnDuplicate: ['deleted'],
  });
}

async function parseDependenciesData(project, dependenciesData, seen) {
  let dependencies = dependenciesData['repository']['dependencyGraphManifests']['nodes'];
  let dependenciesList = [];
  let dependFullNameList = [];
  let language;
  for (const depend of dependencies) {
    const dependNodes = depend['dependencies']['nodes'];
    for (let i = 0; i < dependNodes.length; i++) {
      if (!dependNodes[i]['requirements']) {
        continue;
      }
      const requirements = dependNodes[i]['requirements'];
      if (dependNodes[i]['repository']) {
        const dependentOwner = dependNodes[i]['repository']['owner']['login'];
        const dependentName = dependNodes[i]['repository']['name'];
        const dependentHtmlUrl = `https://github.com/${dependentOwner}/${dependentName}`;
        const dependentOwnerType = await getOwnerType(
          dependNodes[i]['repository']['isInOrganization'],
        );
        if (seen.has(dependentHtmlUrl)) {
          continue;
        }
        if (!language && dependNodes[i]['repository']['primaryLanguage']) {
          language = dependNodes[i]['repository']['primaryLanguage'].name;
        }
        seen.add(dependentHtmlUrl);
        const dependProject = await getProjectInfoByUrl(dependentHtmlUrl);
        const data = {
          fullName: `${project.ownerName}/${project.name}`,
          pId: project.pId,
          ownerName: project.ownerName,
          name: project.name,
          language: language,
          ownerType: project.ownerType,
          dependentPId: dependProject === undefined ? null : dependProject.pId,
          dependentFullName: `${dependentOwner}/${dependentName}`,
          dependentOwnerName: dependentOwner,
          dependentName: dependentName,
          dependentRequirements: requirements,
          dependentHtmlUrl: dependentHtmlUrl,
          dependentOwnerType: dependentOwnerType,
          lastUpdatedDate: Date.now(),
        };
        dependenciesList.push(data);
        dependFullNameList.push(data.dependentFullName);
      }
    }
  }
  return { dependenciesList: dependenciesList, dependFullNameList: dependFullNameList };
}

async function saveDate(dependenciesList) {
  if (dependenciesList.length === 0) {
    return;
  }
  const updateOnDuplicate = Object.keys(dependenciesList[0]).slice(1);
  await GithubProjectsDependencies.bulkCreate(dependenciesList, { updateOnDuplicate })
    .then(dependent => {
      logger.info(`Insert ${dependent.length} dependent data`);
    })
    .catch(error => {
      logger.error('Batch insert error: ', error.message);
    });
}

async function getProjectInfoByUrl(repoUrl) {
  const project = await ViewProjects.findOne({
    attributes: ['pId', 'ownerName', 'name', 'ownerType'],
    where: {
      htmlUrl: repoUrl,
    },
  });
  if (project === null) {
    logger.info('project not exists');
    return;
  }
  return project;
}

async function getOwnerType(isInOrganization) {
  if (isInOrganization) {
    return 'Organization';
  }
  return 'User';
}
