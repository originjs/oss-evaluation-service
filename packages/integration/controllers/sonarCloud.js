import {
  GithubProjects,
  ProjectTechStack,
  SonarCloudProject,
} from '@orginjs/oss-evaluation-data-model';
import { Op } from 'sequelize';
import SonarCloudSdk from '@orginjs/sonarCloud-sdk/src/index.js';
import sonarCloudProject from '@orginjs/oss-evaluation-data-model/models/SonarCloudProject.js';
import { sleep } from '../util/util.js';
import { GitlabSdk } from '@orginjs/gitlab-sdk/src/sdk.js';
import OssGitlabFork from '@orginjs/oss-evaluation-data-model/models/OssGitlabFork.js';

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

export async function createGitlabProject(req, res) {
  let techStack = await ProjectTechStack.findAll({
    where: {
      subcategory: {
        [Op.in]: [req.query.techStack],
      },
    },
    attributes: ['projectId'],
  });
  const projects = await GithubProjects.findAll({
    where: {
      id: {
        [Op.in]: techStack.map(tech => tech.projectId),
      },
    },
    attributes: ['fullName', 'ownerName', 'name', 'id', 'cloneUrl'],
    order: [['id', 'desc']],
  });

  const gitlabSdk = new GitlabSdk();
  const namespaceId = process.env.GITLAB_FORK_NAMESPACE_ID;
  for (let project of projects) {
    let projectId = project.id;
    const val = {
      name: project.name,
      import_url: project.cloneUrl,
      namespace_id: namespaceId,
      visibility: 'public',
    };
    const gitlabFork = await OssGitlabFork.findOne({
      where: {
        githubProjectId: projectId,
      },
    });
    if (gitlabFork) {
      continue;
    }
    const response = await recordTime(
      gitlabSdk.importFromUrl,
      `create gitlab fork of ${project.fullName}`,
      val,
    );
    await sleep(Math.floor(Math.random() * 5000) + 1000);
    if (!response.ok) {
      console.error(`${response.status}:${await response.text()}`);
      continue;
    }
    let json = await response.json();
    const forkResult = {
      githubProjectId: projectId,
      projectId: json.id,
      githubFullName: project.fullName,
      fullName: json.name_with_namespace,
      fullPath: json.path_with_namespace,
      name: json.name,
      defaultBranch: json.default_branch,
      sshCloneUrl: json.ssh_url_to_repo,
      httpCloneUrl: json.http_url_to_repo,
      webUrl: json.web_url,
      namespaceId: json.namespace?.id,
      namespaceName: json.namespace?.name,
      namespacePath: json.namespace?.path,
    };
    await OssGitlabFork.upsert(forkResult);
  }
  res.status(200);
  res.send('{success}');
}

export async function createSonarProjectFromGitlab(req, res) {
  //   query all gitlab project
  const gitlabForks = await OssGitlabFork.findAll();
  const sonarCloudSdk = new SonarCloudSdk();
  for (const fork of gitlabForks) {
    const {
      githubProjectId,
      githubFullName,
      projectId: gitlabProjectId,
      fullPath: gitlabFullName,
      namespacePath,
      name,
    } = fork;
    // need to create sonar cloud project?
    const sonarProject = await SonarCloudProject.findOne({
      where: {
        githubProjectId,
        gitlabProjectId,
      },
    });
    if (sonarProject) {
      continue;
    }

    const param = {
      name,
      newCodeDefinitionValue: 30,
      newCodeDefinitionType: 'days',
      organization: namespacePath,
      visibility: 'public',
      project: `${namespacePath}_${name}`,
    };
    // request for creating sonar project
    const response = await recordTime(
      sonarCloudSdk.createProject,
      `create sonar project from gitlab:${gitlabFullName}`,
      param,
    );
    await sleep(Math.floor(Math.random() * 5000) + 1000);
    if (!response.ok) {
      console.error(`${response.status}:${await response.text()}`);
      continue;
    }
    const json = await response.json();
    const createResult = {
      githubProjectId,
      gitlabProjectId,
      githubFullName,
      gitlabFullName,
      sonarProjectKey: json.project.key,
    };
    await SonarCloudProject.create(createResult);
  }

  res.status(200);
  res.send('{success}');
}

export async function uploadSonarCiConfigToGitlab(req, res) {
  //   query all gitlab project
  const gitlabForks = await OssGitlabFork.findAll({
    where: {
      hasSonarPipeline: false,
    },
    attributes: ['projectId', 'defaultBranch'],
  });
  const ciFileContent = `variables:
  SONAR_USER_HOME: "\${CI_PROJECT_DIR}/.sonar"  # Defines the location of the analysis task cache
  GIT_DEPTH: "0"  # Tells git to fetch all the branches of the project, required by the analysis task
sonarcloud-check:
  image:
    name: sonarsource/sonar-scanner-cli:latest
    entrypoint: [""]
  cache:
    key: "\${CI_JOB_NAME}"
    paths:
      - .sonar/cache
  script:
    - sonar-scanner
  only:
    - merge_requests
    - master
    - main
`;
  const gitlabSdk = new GitlabSdk();

  for (const fork of gitlabForks) {
    const sonarProject = await SonarCloudProject.findOne({
      where: {
        gitlabProjectId: fork.projectId,
      },
      attributes: ['sonarProjectKey'],
    });
    if (!sonarProject) {
      continue;
    }
    const sonarPropertyFileContent = `sonar.projectKey=${sonarProject.sonarProjectKey}
sonar.organization=oss-github-fork

# This is the name and version displayed in the SonarCloud UI.
#sonar.projectName=angular
#sonar.projectVersion=1.0


# Path is relative to the sonar-project.properties file. Replace "\\" by "/" on Windows.
sonar.sources=.

# Encoding of the source code. Default is default system encoding
#sonar.sourceEncoding=UTF-8
`;
    const commitInfo = {
      branch: fork.defaultBranch,
      commit_message: 'ci: sonar scan',
      actions: [
        {
          action: 'create',
          file_path: '.gitlab-ci.yml',
          content: ciFileContent,
        },
        {
          action: 'create',
          file_path: 'sonar-project.properties',
          content: sonarPropertyFileContent,
        },
      ],
    };

    const response = await recordTime(
      gitlabSdk.createCommit,
      `add sonar ci for gitlab:${fork.projectId}`,
      fork.projectId,
      commitInfo,
    );
    if (!response.ok) {
      console.error(`${response.status}:${await response.text()}`);
      continue;
    }
    await OssGitlabFork.update(
      {
        hasSonarPipeline: true,
      },
      {
        where: {
          projectId: fork.projectId,
        },
      },
    );
    await sleep(Math.floor(Math.random() * 1000) + 1000);
  }
  res.status(200);
  res.send('{success}');
}

export async function updateSonarCloudDefaultBranch(req, res) {
  const sonarProjects = await sonarCloudProject.findAll();
  if (!sonarProjects || !sonarProjects.length) {
    res.status(200);
    res.json({ msg: 'empty' });
  }
  const sonarCloudSdk = new SonarCloudSdk();
  for (const sonarProject of sonarProjects) {
    const { gitlabProjectId, defaultBranch: sonarDefaultBranch, sonarProjectKey } = sonarProject;
    const gitlabFork = await OssGitlabFork.findOne({
      where: {
        projectId: gitlabProjectId,
      },
      attributes: ['defaultBranch'],
    });

    if (!gitlabFork) {
      continue;
    }
    const { defaultBranch: gitlabDefaultBranch } = gitlabFork;
    if (sonarDefaultBranch === gitlabDefaultBranch) {
      continue;
    }

    //  get sonarCloud all branch info
    const response = await recordTime(
      sonarCloudSdk.listProjectBranches,
      `list sonar branches of ${sonarProjectKey}`,
      sonarProjectKey,
    );
    await sleep(Math.floor(Math.random() * 1000) + 500);
    if (!response.ok) {
      console.error(`get sonar project branches info failed`, await response.text());
      continue;
    }
    const sonarBranches = (await response.json()).branches;
    const mainBranch = sonarBranches.find(item => item.isMain);
    if (sonarBranches.length > 1) {
      //   delete all non-primary branches
      for (const branch of sonarBranches.filter(item => !item.isMain)) {
        const deleteResponse = await recordTime(
          sonarCloudSdk.deleteBranch,
          `delete sonar branch:${branch.name} of ${sonarProjectKey}`,
          sonarProjectKey,
          branch.name,
        );
        await sleep(Math.floor(Math.random() * 1000) + 500);
        if (!deleteResponse.ok) {
          console.error(`delete sonar project branch failed`, await response.text());
        }
      }
    }
    if (mainBranch.name === gitlabDefaultBranch) {
      await SonarCloudProject.update(
        {
          defaultBranch: gitlabDefaultBranch,
        },
        {
          where: {
            sonarProjectKey,
          },
        },
      );
      continue;
    }
    //   change sonar primary branch name to default branch
    const renameResponse = await recordTime(
      sonarCloudSdk.renameMainBranch,
      `rename sonar project:${sonarProjectKey} branch:${mainBranch.name} to ${gitlabDefaultBranch}`,
      sonarProjectKey,
      gitlabDefaultBranch,
    );
    await sleep(Math.floor(Math.random() * 1000) + 500);
    if (!renameResponse.ok) {
      console.error(
        `rename sonar project:${sonarProjectKey} branch:${mainBranch.name} to ${gitlabDefaultBranch}`,
        await renameResponse.text(),
      );
      continue;
    }
    await SonarCloudProject.update(
      {
        defaultBranch: gitlabDefaultBranch,
      },
      {
        where: {
          sonarProjectKey,
        },
      },
    );
  }
  res.status(200);
  res.send('success');
}
