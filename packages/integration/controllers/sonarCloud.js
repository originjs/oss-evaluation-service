import {
  GithubProjects,
  OssGitlabFork,
  SonarCloudProject,
} from '@orginjs/oss-evaluation-data-model';
import { literal, Op } from 'sequelize';
import SonarCloudSdk from '@orginjs/sonarCloud-sdk/src/index.js';
import { sleep } from '../util/util.js';
import { GitlabSdk } from '@orginjs/gitlab-sdk/src/sdk.js';
import _ from 'underscore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'path';

const getRating = rating => {
  switch (rating) {
    case '1.0':
      return 'A';
    case '2.0':
      return 'B';
    case '3.0':
      return 'C';
    case '4.0':
      return 'D';
    case '5.0':
      return 'E';
  }
};

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
  const sonarKeys = req.body;
  await collectSonarCloudDataBySonarKeys(sonarKeys);
  res.status(200);
  res.send('success');
}

async function collectSonarCloudDataBySonarKeys(sonarKeys) {
  let sonarCloudProjects;
  if (!sonarKeys || !sonarKeys.length) {
    sonarCloudProjects = await SonarCloudProject.findAll({
      attributes: ['sonarProjectKey', 'defaultBranch'],
      where: {
        analysisDate: {
          [Op.eq]: null,
        },
      },
    });
  } else {
    sonarCloudProjects = await SonarCloudProject.findAll({
      attributes: ['sonarProjectKey', 'defaultBranch'],
      where: {
        sonarProjectKey: {
          [Op.in]: sonarKeys,
        },
      },
    });
  }
  if (!sonarCloudProjects?.length) {
    console.warn('no sonarCloud project!!');
  }
  const sonarCloudSdk = new SonarCloudSdk();
  const metricKeys =
    // eslint-disable-next-line max-len
    'accepted_issues,new_technical_debt,blocker_violations,bugs,classes,code_smells,cognitive_complexity,comment_lines,comment_lines_density,branch_coverage,new_branch_coverage,conditions_to_cover,new_conditions_to_cover,confirmed_issues,coverage,new_coverage,critical_violations,complexity,duplicated_blocks,new_duplicated_blocks,duplicated_files,duplicated_lines,duplicated_lines_density,new_duplicated_lines_density,new_duplicated_lines,effort_to_reach_maintainability_rating_a,false_positive_issues,files,functions,generated_lines,generated_ncloc,info_violations,violations,line_coverage,new_line_coverage,lines,ncloc,lines_to_cover,new_lines_to_cover,sqale_rating,new_maintainability_rating,major_violations,minor_violations,new_accepted_issues,new_blocker_violations,new_bugs,new_code_smells,new_critical_violations,new_info_violations,new_violations,new_lines,new_major_violations,new_minor_violations,new_security_hotspots,new_vulnerabilities,open_issues,projects,alert_status,reliability_rating,new_reliability_rating,reliability_remediation_effort,new_reliability_remediation_effort,reopened_issues,security_hotspots,security_hotspots_reviewed,new_security_hotspots_reviewed,security_rating,new_security_rating,security_remediation_effort,new_security_remediation_effort,security_review_rating,new_security_review_rating,skipped_tests,statements,sqale_index,sqale_debt_ratio,new_sqale_debt_ratio,uncovered_conditions,new_uncovered_conditions,uncovered_lines,new_uncovered_lines,test_execution_time,test_errors,test_failures,test_success_density,tests,vulnerabilities,wont_fix_issues';
  for (const { sonarProjectKey, defaultBranch } of sonarCloudProjects) {
    // get measures
    const measuresResponse = await recordTime(
      sonarCloudSdk.getMeasures,
      `get measures of sonar project ${sonarProjectKey}`,
      {
        branch: defaultBranch,
        component: sonarProjectKey,
        metricKeys,
      },
    );
    await sleep(Math.floor(Math.random() * 500) + 100);
    if (!measuresResponse.ok) {
      console.log(
        `get measures of sonar project ${sonarProjectKey} error`,
        await measuresResponse.text(),
      );
      continue;
    }
    const measuresJson = await measuresResponse.json();
    const metrics = measuresJson?.component?.measures;
    if (!metrics || !metrics.length) {
      console.warn(`get empty metrics of sonar project ${sonarProjectKey}`);
      continue;
    }
    const metricMap = new Map();
    metrics.forEach(item => {
      metricMap.set(item.metric, item.value);
    });
    const updateMetric = {
      bugs: metricMap.get('bugs'),
      reliabilityRating: getRating(metricMap.get('reliability_rating')),
      vulnerabilities: metricMap.get('vulnerabilities'),
      securityRating: getRating(metricMap.get('security_rating')),
      securityHotspots: metricMap.get('security_hotspots'),
      securityHotspotsReviewed: metricMap.get('security_hotspots_reviewed'),
      securityReviewRating: getRating(metricMap.get('security_review_rating')),
      codeSmells: metricMap.get('code_smells'),
      maintainabilityRating: getRating(metricMap.get('sqale_rating')),
      coverageRating: metricMap.get('coverage'),
      duplicatedLinesDensity: metricMap.get('duplicated_lines_density'),
      codeLines: metricMap.get('ncloc'),
      allMeasures: metrics,
    };
    await SonarCloudProject.update(updateMetric, {
      where: {
        sonarProjectKey,
      },
    });
    const response = await sonarCloudSdk.listProjectBranches(sonarProjectKey);
    await sleep(Math.floor(Math.random() * 500) + 100);
    if (!response.ok) {
      console.log(await response.text());
      continue;
    }
    const branches = (await response.json()).branches;
    if (!branches || !branches.length) {
      continue;
    }
    const mainBranch = branches.find(branch => branch?.isMain) || branches[0];
    const updateInfo = {
      analysisDate: mainBranch.analysisDate,
    };

    await SonarCloudProject.update(updateInfo, {
      where: {
        sonarProjectKey,
      },
    });
  }
}

async function recordTime(func, name, ...args) {
  const start = new Date();
  console.log(`start ${name}`);
  const result = await func(...args);
  const end = new Date();
  console.log(`end ${name} ${end - start}ms`);
  return result;
}

export async function updateDefaultBranchAfterImport(req, res) {
  const gitlabForks = await OssGitlabFork.findAll({
    where: {
      updatedPrimaryBranch: false,
    },
  });
  if (!gitlabForks?.length) {
    res.status(200);
  }
  const gitlabSdk = new GitlabSdk();
  for (const gitlabFork of gitlabForks) {
    const projectId = gitlabFork.projectId;
    recordTime(
      gitlabSdk.getProjectInfo,
      `update gitlab defaultBranch of ${gitlabFork.fullPath}:${gitlabFork.projectId}`,
      projectId,
    );
    const response = await gitlabSdk.getProjectInfo(projectId);
    await sleep(Math.floor(Math.random() * 500) + 100);
    if (!response.ok) {
      continue;
    }
    const projectInfo = await response.json();
    await OssGitlabFork.update(
      {
        defaultBranch: projectInfo?.default_branch,
        updatedPrimaryBranch: true,
      },
      {
        where: {
          projectId,
        },
      },
    );
  }
  res.status(200);
  res.send('success');
}

export async function createAndScanSonarProjectByGithubId(req, res) {
  const githubIds = req.body;
  const sonarCloudSdk = new SonarCloudSdk();
  for (const githubId of githubIds) {
    //   query for sonar
    let sonarProject = await SonarCloudProject.findOne({
      where: {
        githubProjectId: githubId,
      },
    });

    const githubProject = await GithubProjects.findOne({
      where: {
        id: githubId,
      },
    });

    if (null == githubProject) {
      continue;
    }
    let sonarProjectKey = sonarProject?.sonarProjectKey;
    if (null == sonarProject) {
      //   create sonar project
      const param = {
        name: githubProject.fullName,
        newCodeDefinitionType: 'previous_version',
        organization: process.env.SONAR_ORG_NAME,
        visibility: 'public',
        newCodeDefinitionValue: 'previous_version',
        project: `${process.env.SONAR_ORG_NAME}-${githubProject.fullName.replaceAll('/', '_')}`,
      };
      // request for creating sonar project
      const createSonarProjectResponse = await recordTime(
        sonarCloudSdk.createProject,
        `create sonar project from gitlab:${githubProject.fullName}`,
        param,
      );
      if (!createSonarProjectResponse.ok) {
        console.error(`create sonar project failed , ${await createSonarProjectResponse.text()}`);
        continue;
      } else {
        sonarProjectKey = (await createSonarProjectResponse.json()).project.key;
      }
      const createSonarProject = {
        githubProjectId: githubId,
        githubFullName: githubProject.fullName,
        sonarProjectKey: sonarProjectKey,
      };
      await SonarCloudProject.create(createSonarProject);
      sonarProject = createSonarProject;
    }

    // set default branch of sonar project
    if (!sonarProject.defaultBranch) {
      // get default branch
      const branchResponse = await getDefaultBranchByGit(
        githubProject.ownerName,
        githubProject.name,
      );
      if (!branchResponse.ok) {
        continue;
      }
      const defaultBranchName = (await branchResponse.json()).data;
      const listSonarBranches = await recordTime(
        sonarCloudSdk.listProjectBranches,
        `list sonar branches of ${sonarProjectKey}`,
        sonarProjectKey,
      );
      await sleep(Math.floor(Math.random() * 500) + 100);
      if (!listSonarBranches.ok) {
        console.error(`get sonar project branches info failed`, await listSonarBranches.text());
        continue;
      }
      const sonarBranches = (await listSonarBranches.json()).branches;
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
          await sleep(Math.floor(Math.random() * 500) + 100);
          if (!deleteResponse.ok) {
            console.error(`delete sonar project branch failed`, await listSonarBranches.text());
          }
        }
      }
      if (mainBranch.name === defaultBranchName) {
        await SonarCloudProject.update(
          {
            defaultBranch: defaultBranchName,
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
        `rename sonar project:${sonarProjectKey} branch:${mainBranch.name} to ${defaultBranchName}`,
        sonarProjectKey,
        defaultBranchName,
      );
      await sleep(Math.floor(Math.random() * 500) + 100);
      if (!renameResponse.ok) {
        console.error(
          `rename sonar project:${sonarProjectKey} branch:${mainBranch.name} to ${defaultBranchName}`,
          await renameResponse.text(),
        );
        continue;
      }
      await SonarCloudProject.update(
        {
          defaultBranch: defaultBranchName,
        },
        {
          where: {
            sonarProjectKey,
          },
        },
      );
      await sleep(Math.floor(Math.random() * 500) + 100);
    }

    if (!sonarProject.analysisDate) {
      //   start sonar scanner
      const scanResponse = await startSonarScanner(
        githubProject.ownerName,
        githubProject.name,
        process.env.SONAR_ORG_NAME,
        sonarProjectKey,
        'https://sonarcloud.io',
        githubProject.language,
      );

      if (scanResponse.ok) {
        //   collect sonar data
        await collectSonarCloudDataBySonarKeys([sonarProjectKey]);
      }
    }
  }
  res.status(200);
  res.json('success');
}

async function getDefaultBranchByGit(owner, repoName) {
  const url = `${process.env.SONAR_SCAN_SERVICE_HOST}/sonar/getDefaultBranch/${owner}/${repoName}`;
  return await fetch(url, {
    method: 'get',
  });
}

async function startSonarScanner(owner, repoName, sonarOrg, sonarKey, sonarHostUrl, language) {
  const url = `${process.env.SONAR_SCAN_SERVICE_HOST}/sonar/scan`;
  const body = {
    gitOwner: owner,
    repoName,
    sonarOrg,
    sonarKey,
    sonarHostUrl,
    language,
  };
  return await fetch(url, {
    method: 'post',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function createGitlabProject(req, res) {
  const paramProjectIds = req.body;
  const { namespaceId } = req.params;
  const githubProjects = await GithubProjects.findAll({
    where: {
      id: {
        [Op.in]: paramProjectIds,
      },
    },
    attributes: ['fullName', 'ownerName', 'name', 'id', 'cloneUrl'],
    order: [['id', 'desc']],
  });

  if (!githubProjects?.length) {
    res.status(200);
    res.send('no projects');
    return;
  }

  const gitlabSdk = new GitlabSdk();
  let count = 0;
  for (const project of githubProjects) {
    const projectId = project.id;
    const gitlabFork = await OssGitlabFork.findOne({
      where: {
        githubProjectId: projectId,
      },
    });
    if (gitlabFork) {
      count++;
      continue;
    }
    const val = {
      name: `${project.ownerName}_${project.name}`,
      import_url: project.cloneUrl,
      namespace_id: namespaceId,
      visibility: 'public',
    };
    const response = await recordTime(
      gitlabSdk.importFromUrl,
      `create gitlab fork of ${project.fullName}`,
      val,
    );
    await sleep(Math.floor(Math.random() * 500) + 100);
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
    count++;
    console.log(`create gitlab project ${count} / ${paramProjectIds.length}`);
  }
  res.status(200);
  res.send(`success ${count}/${paramProjectIds.length} projects`);
}

export async function createSonarProjectFromGitlab(req, res) {
  //   query all gitlab project
  const gitlabForks = await OssGitlabFork.findAll({
    where: {
      githubProjectId: {
        [Op.notIn]: literal('(select github_project_id from sonar_cloud_project)'),
      },
    },
  });
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
    await sleep(Math.floor(Math.random() * 500) + 100);
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

function getGitlabCiConfigContent(fork, githubProject) {
  const language = githubProject.language;
  const templateDir = join(dirname(fileURLToPath(import.meta.url)), '../template');
  let filePath;
  switch (language.toUpperCase()) {
    case 'JAVA':
      filePath = join(templateDir, 'gitlab-ci-java.yml.template');
      break;
    case 'C':
    case 'C++':
      filePath = join(templateDir, 'gitlab-ci-c.yml.template');
      break;
    default:
      filePath = join(templateDir, 'gitlab-ci-others.yml.template');
  }
  const configTemplate = readFileSync(filePath, 'utf-8');
  return _.template(configTemplate)({ defaultBranch: fork.defaultBranch });
}

export async function uploadSonarCiConfigToGitlab(req, res) {
  //   query all gitlab project
  const gitlabForks = await OssGitlabFork.findAll({
    where: {
      hasSonarPipeline: false,
    },
    attributes: ['projectId', 'defaultBranch', 'namespacePath', 'githubProjectId'],
  });
  const gitlabSdk = new GitlabSdk();
  const templateDir = join(dirname(fileURLToPath(import.meta.url)), '../template');
  const sonarConfigTemplate = readFileSync(
    join(templateDir, 'sonar-project.properties.template'),
    'utf-8',
  );

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

    const githubProject = await GithubProjects.findOne({
      where: {
        id: fork.githubProjectId,
      },
      attributes: ['language'],
    });
    if (!githubProject) {
      continue;
    }

    const ciFileContent = getGitlabCiConfigContent(fork, githubProject);
    const sonarPropertyFileContent = _.template(sonarConfigTemplate)({
      sonarProjectKey: sonarProject.sonarProjectKey,
      namespacePath: fork.namespacePath,
    });
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
    await sleep(Math.floor(Math.random() * 500) + 100);
  }
  res.status(200);
  res.send('{success}');
}

export async function updateSonarCloudDefaultBranch(req, res) {
  const sonarProjects = await SonarCloudProject.findAll({
    where: {
      defaultBranch: '',
    },
  });
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
    await sleep(Math.floor(Math.random() * 500) + 100);
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
        await sleep(Math.floor(Math.random() * 500) + 100);
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
    await sleep(Math.floor(Math.random() * 500) + 100);
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
