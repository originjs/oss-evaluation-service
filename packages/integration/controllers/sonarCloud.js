import {
  GithubProjects,
  OssGithubFork,
  SonarCloudProject,
} from '@orginjs/oss-evaluation-data-model';
import { Op } from 'sequelize';
import GithubSdk from '@orginjs/github-sdk/src/index.js';
import SonarCloudSdk from '@orginjs/sonarCloud-sdk/src/index.js';
import sonarCloudProject from '@orginjs/oss-evaluation-data-model/models/SonarCloudProject.js';

export async function createSonarCloudProject(req, res) {
  const paramProjects = JSON.parse(req.query.projects);
  //   query GitHub project
  const projects = await GithubProjects.findAll({
    where: {
      fullName: {
        [Op.in]: paramProjects,
      },
    },
    attributes: ['fullName', 'ownerName', 'name'],
    limit: 2,
    order: [['id', 'desc']],
  });

  let githubSdk = new GithubSdk();
  let sonarCloudSdk = new SonarCloudSdk();
  //   need fork?
  for (let project of projects) {
    const { fullName, ownerName, name } = project;
    let ossFork = await OssGithubFork.findOne({
      where: {
        upstreamName: fullName,
      },
    });
    if (!ossFork) {
      // create fork
      const forkResponse = await recordTime(
        githubSdk.createFork,
        `fork repo ${fullName}`,
        ownerName,
        name,
      );

      if (!forkResponse.ok) {
        console.error(forkResponse.text);
        throw new Error(`repo:${project.fullName} fork err!!`);
      }
      const forkJson = await forkResponse.json();
      const forkResult = {
        upstreamName: fullName,
        fullName: forkJson.full_name,
        projectId: forkJson.id,
      };

      await OssGithubFork.upsert(forkResult);
      ossFork = forkResult;
    }

    if (ossFork) {
      let sonarProject = await SonarCloudProject.findOne({
        where: {
          githubFullName: ossFork.fullName,
        },
      });
      //   need create sonarCloud project?
      if (sonarProject) {
        continue;
      }
      const sonarResponse = await recordTime(
        sonarCloudSdk.createProjectInternalApi,
        'create sonarCloud project',
        {
          projects: [
            {
              repoName: ossFork.fullName,
              projectId: ossFork.projectId,
            },
          ],
          newCodeDefinitionValue: 30,
          newCodeDefinitionType: 'days',
          organization: 'oss-integration',
        },
      );

      if (!sonarResponse.ok) {
        console.error(sonarResponse.text());
        throw new Error(`repo:${sonarResponse.fullName} fork err!!`);
      }
      const sonarJson = await sonarResponse.json();
      const sonarProjectKey = sonarJson.projects[0].projectKey;
      await SonarCloudProject.upsert({
        githubFullName: ossFork.fullName,
        sonarProjectKey,
      });

      //   active auto scan
      await sonarCloudSdk.activeAutoScanInternalApi(sonarProjectKey);
    }
  }
  res.status(200);
}

/**
 * {
 *     "branches": [
 *         {
 *             "name": "main",
 *             "isMain": true,
 *             "type": "LONG",
 *             "status": {
 *                 "bugs": 31,
 *                 "vulnerabilities": 0,
 *                 "codeSmells": 666
 *             },
 *             "analysisDate": "2024-03-19T07:45:11+0100",
 *             "commit": {
 *                 "sha": "72104f6de5398a1a0511404e8485b3b7721be537",
 *                 "author": {
 *                     "name": "Anonymous User"
 *                 },
 *                 "date": "2024-03-18T06:24:35+0100",
 *                 "message": "chore(deps): update dependency vue-tsc to v2 (#16187)"
 *             }
 *         }
 *     ]
 * }
 * @return {Promise<void>}
 */
export async function collectSonarCloudData(req, res) {
  const sonarCloudProjects = await sonarCloudProject.findAll();
  if (!sonarCloudProjects || !sonarCloudProjects.length) {
    console.warn('no sonarCloud project!!');
  }
  let sonarCloudSdk = new SonarCloudSdk();
  for (const { sonarProjectKey } of sonarCloudProjects) {
    let response = await sonarCloudSdk.listProjectBranches(sonarProjectKey);
    if (!response.ok) {
      console.log(await response.text());
      continue;
    }
    let branches = (await response.json()).branches;
    if (!branches || !branches.length) {
      continue;
    }
    let mainBranch = branches.find(branch => branch?.isMain) || branches[0];
    const updateInfo = {
      analysisDate: mainBranch.analysisDate,
      bugs: mainBranch.status.bugs,
      vulnerabilities: mainBranch.status.vulnerabilities,
      codeSmells: mainBranch.status.codeSmells,
    };

    await SonarCloudProject.update(updateInfo, {
      where: {
        sonarProjectKey,
      },
    });
  }
  res.status(200);
  res.send('success');
}

async function recordTime(func, name, ...args) {
  const start = new Date();
  console.log(`start ${name}`);
  const result = await func(...args);
  const end = new Date();
  console.log(`end ${name} ${end - start}ms`);
  return result;
}
