import debug from 'debug';
import { gql, request } from 'graphql-request';
import { getProjectByUrl } from '../util/util.js';
import { authorizationHeader } from '../../api-sdk/util.js';
import { GithubSdk } from '@orginjs/github-sdk/src/sdk.js';
import { GithubProjects, GithubProjectsDependencies } from '@orginjs/oss-evaluation-data-model';

const graphqlUrl = 'https://api.github.com/graphql';

const queryPackageName = gql`
  query($repoOwner: String!,
    $repoName: String!,
  ) {
      repository(owner: $repoOwner name: $repoName) {
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
  const project = await getProjectByUrl(repoUrl);
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
  if (!project.fullName) {
    return;
  }
  const fullNameArr = project.fullName.split('/');
  await getDependencies(fullNameArr[0], fullNameArr[1], new Set());
}

export async function syncAllProjectDependencies() {
  debug.log('Sync Project Dependent');
  // 1. get all github project
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'ownerName', 'name'],
  });
  const sumOfProject = projectList.length;
  debug.log(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    debug.log('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. project Dependent
    await getDependencies(project.ownerName, project.name, new Set());
  }
}

export async function getDependencies(repoOwner, repoName, seen) {
  let githubSdk = new GithubSdk();
  const headers = authorizationHeader(githubSdk.token);
  headers.append('Accept', 'application/vnd.github.hawkgirl-preview+json');

  const dependenciesData = await request(graphqlUrl, queryPackageName, {
    repoOwner: repoOwner,
    repoName: repoName,
  }, headers).catch(error => {
    debug.log('Post to dependencies error : ', error.message);
  });
  if (dependenciesData === undefined || !dependenciesData['repository']) {
    return;
  }
  const dependenciesList = await parseDependenciesData(repoOwner, repoName, dependenciesData, seen);
  await saveDate(dependenciesList);
}

async function parseDependenciesData(repoOwner, repoName, dependenciesData, seen) {
  let dependencies = dependenciesData['repository']['dependencyGraphManifests']['nodes'];
  let dependenciesList = [];
  let language;
  dependencies.forEach(depend => {
    const dependNodes = depend['dependencies']['nodes'];
    for (let i = 0; i < dependNodes.length; i++) {
      if (dependNodes[i]['repository']) {
        const dependentOwner = dependNodes[i]['repository']['owner']['login'];
        const dependentName = dependNodes[i]['repository']['name'];
        const dependentHtmlUrl = `https://github.com/${dependentOwner}/${dependentName}`;
        if (seen.has(dependentHtmlUrl)) {
          continue;
        }
        if (!language && dependNodes[i]['repository']['primaryLanguage']) {
          language = dependNodes[i]['repository']['primaryLanguage'].name;
        }
        seen.add(dependentHtmlUrl);
        const data = {
          fullName: `${repoOwner}/${repoName}`,
          ownerName: repoOwner,
          name: repoName,
          language: language,
          dependentFullName: `${dependentOwner}/${dependentName}`,
          dependentOwnerName: dependentOwner,
          dependentName: dependentName,
          dependentHtmlUrl: dependentHtmlUrl,
          lastUpdatedDate: Date.now(),
        };
        dependenciesList.push(data);
      }
    }
  });
  return dependenciesList;
}

async function saveDate(dependenciesList) {
  if (dependenciesList.length === 0) {
    return;
  }
  const updateOnDuplicate = Object.keys(dependenciesList[0]).slice(1);
  await GithubProjectsDependencies.bulkCreate(dependenciesList, { updateOnDuplicate })
    .then(dependent => {
      debug.log(`Insert ${dependent.length} dependent data`);
    })
    .catch(error => {
      debug.log('Batch insert error: ', error.message);
    });
}
