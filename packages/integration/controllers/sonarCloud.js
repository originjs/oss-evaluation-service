import {
  GithubProjects,
  logger,
  OssGitlabFork,
  SonarCloudProject,
} from '@orginjs/oss-evaluation-data-model';
import { literal, Op } from 'sequelize';
import { sleep, timer } from '../util/util.js';
import { GitlabSdk } from '@orginjs/gitlab-sdk/src/sdk.js';
import _ from 'underscore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'path';
import sonarCloudProject from '@orginjs/oss-evaluation-data-model/models/SonarCloudProject.js';
import GithubSdk from '@orginjs/github-sdk/src/index.js';
import SonarCloudSdk from '@orginjs/sonar-cloud-sdk';

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
  res.json({
    ok: true,
    msg: `collect sonar projects:${JSON.stringify(sonarKeys)} success`,
  });
}

const sonarCloudSdk = new SonarCloudSdk();

export async function changeSonarKey2OfficialKeys(req, res) {
  const githubIds = req.body;
  for (const id of githubIds) {
    await collectSonarCloudByOfficialKey(id);
  }
  res.status(200);
  res.json({
    ok: true,
  });
}

async function collectSonarCloudByOfficialKey(githubId) {
  if (!githubId) {
    return false;
  }

  const githubProject = await GithubProjects.findOne({
    where: {
      id: githubId,
    },
  });

  if (!githubProject) {
    return false;
  }
  // try to get official sonar cloud data
  if (githubProject.ownerType !== 'Organization') {
    return false;
  }
  const officialKey = githubProject.fullName.replaceAll('/', '_');
  const measures = await getAllMeasuresSonarCloudData(officialKey, githubProject.defaultBranch);
  if (!measures) {
    return false;
  }

  // get last analyse time
  const branchAnalyseResponse = await sonarCloudSdk.getBranchAnalyseTime(
    officialKey,
    githubProject.defaultBranch,
  );
  if (!branchAnalyseResponse.ok) {
    logger.error(`officialSonarProject:{${officialKey}} has result but misses time`);
    return false;
  }
  measures.analysisDate = (await branchAnalyseResponse.json()).analyses[0].date;
  measures.defaultBranch = githubProject.defaultBranch;

  const sonarProject = await SonarCloudProject.findOne({
    where: {
      githubProjectId: githubId,
    },
  });
  if (sonarProject) {
    if (sonarProject?.sonarProjectKey !== officialKey) {
      measures.sonarOrg = githubProject.ownerName;
      measures.sonarProjectKey = officialKey;
    }
    SonarCloudProject.update(measures, {
      where: {
        sonarProjectKey: sonarProject.sonarProjectKey,
      },
    });
    return true;
  } else {
    logger.error(`there is no sonar project of key:{${officialKey}}`);
  }
}

async function getAllMeasuresSonarCloudData(sonarKey, branchName) {
  const metricKeys =
    // eslint-disable-next-line max-len
    'accepted_issues,new_technical_debt,blocker_violations,bugs,classes,code_smells,cognitive_complexity,comment_lines,comment_lines_density,branch_coverage,new_branch_coverage,conditions_to_cover,new_conditions_to_cover,confirmed_issues,coverage,new_coverage,critical_violations,complexity,duplicated_blocks,new_duplicated_blocks,duplicated_files,duplicated_lines,duplicated_lines_density,new_duplicated_lines_density,new_duplicated_lines,effort_to_reach_maintainability_rating_a,false_positive_issues,files,functions,generated_lines,generated_ncloc,info_violations,violations,line_coverage,new_line_coverage,lines,ncloc,lines_to_cover,new_lines_to_cover,sqale_rating,new_maintainability_rating,major_violations,minor_violations,new_accepted_issues,new_blocker_violations,new_bugs,new_code_smells,new_critical_violations,new_info_violations,new_violations,new_lines,new_major_violations,new_minor_violations,new_security_hotspots,new_vulnerabilities,open_issues,projects,alert_status,reliability_rating,new_reliability_rating,reliability_remediation_effort,new_reliability_remediation_effort,reopened_issues,security_hotspots,security_hotspots_reviewed,new_security_hotspots_reviewed,security_rating,new_security_rating,security_remediation_effort,new_security_remediation_effort,security_review_rating,new_security_review_rating,skipped_tests,statements,sqale_index,sqale_debt_ratio,new_sqale_debt_ratio,uncovered_conditions,new_uncovered_conditions,uncovered_lines,new_uncovered_lines,test_execution_time,test_errors,test_failures,test_success_density,tests,vulnerabilities,wont_fix_issues';

  const response = await sonarCloudSdk.getMeasures({
    branch: branchName,
    component: sonarKey,
    metricKeys,
  });

  if (!response.ok) {
    return;
  }
  const measuresJson = await response.json();
  const metrics = measuresJson?.component?.measures;
  if (!metrics || !metrics.length) {
    return;
  }
  const metricMap = new Map();
  metrics.forEach(item => {
    metricMap.set(item.metric, item.value);
  });
  return {
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
    logger.error('no sonarCloud project!!');
    return;
  }
  for (let { sonarProjectKey, defaultBranch } of sonarCloudProjects) {
    if (!defaultBranch) {
      //   get the first branch
      const mainBranchOfSonar = await getMainBranchOfSonar(sonarProjectKey);
      if (mainBranchOfSonar) {
        defaultBranch = mainBranchOfSonar.name;
        await sonarCloudProject.update(
          {
            analysisDate: mainBranchOfSonar.analysisDate,
            defaultBranch: mainBranchOfSonar.name,
          },
          {
            where: {
              sonarProjectKey,
            },
          },
        );
      } else {
        continue;
      }
    }
    // get measures
    const measureResult = await getAllMeasuresSonarCloudData(sonarProjectKey, defaultBranch);
    if (!measureResult) {
      continue;
    }
    await SonarCloudProject.update(measureResult, {
      where: {
        sonarProjectKey,
      },
    });
    const mainBranch = await getMainBranchOfSonar(sonarProjectKey);
    if (mainBranch) {
      const updateDate = {
        analysisDate: mainBranch.analysisDate,
      };

      await SonarCloudProject.update(updateDate, {
        where: {
          sonarProjectKey,
        },
      });
    }
  }
}

async function getMainBranchOfSonar(sonarProjectKey) {
  const sonarCloudSdk = new SonarCloudSdk();
  const response = await sonarCloudSdk.listProjectBranches(sonarProjectKey);
  await sleep(Math.floor(Math.random() * 500) + 100);
  if (!response.ok) {
    logger.info(await response.text());
    return;
  }
  const branches = (await response.json()).branches;
  if (branches?.length) {
    return branches.find(branch => branch?.isMain) || branches[0];
  }
}

async function recordTime(func, name, ...args) {
  const start = new Date();
  logger.info(`start ${name}`);
  const result = await func(...args);
  const end = new Date();
  logger.info(`end ${name} ${end - start}ms`);
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

export async function createAndScanSonarProjectByGithubIdHandler(req, res) {
  const githubIds = req.body;
  for (const githubId of githubIds) {
    const githubProject = await GithubProjects.findOne({
      where: {
        id: githubId,
      },
    });
    await sonarScanByProject(githubProject);
  }
  res.status(200);
  res.json('success');
}

export async function sonarScanByProject(githubProject) {
  const sonarScanHost = process.env.REPO_SERVICE_URL;
  if (!sonarScanHost || !process.env.SONAR_CLOUD_TOKEN) {
    logger.warn(`no env \${REPO_SERVICE_URL} or \${SONAR_CLOUD_TOKEN},skip sonar!`);
    return;
  }
  const githubId = githubProject.id;
  const sonarProject = await SonarCloudProject.findOne({
    where: {
      githubProjectId: githubId,
    },
  });
  let sonarProjectKey;
  if (!sonarProject) {
    const sonarCloudSdk = new SonarCloudSdk();
    //   create sonar project
    const param = {
      name: githubProject.fullName,
      newCodeDefinitionType: 'previous_version',
      organization: process.env.SONAR_ORG_NAME,
      visibility: 'public',
      newCodeDefinitionValue: 'previous_version',
      project: `${process.env.SONAR_ORG_NAME}_${githubProject.fullName.replaceAll('/', '-')}`,
    };
    // request for creating sonar project
    const createSonarProjectResponse = await recordTime(
      sonarCloudSdk.createProject,
      `create sonar project from gitlab:${githubProject.fullName}`,
      param,
    );
    if (!createSonarProjectResponse.ok) {
      logger.error(`create sonar project failed , ${await createSonarProjectResponse.text()}`);
      return;
    } else {
      sonarProjectKey = (await createSonarProjectResponse.json()).project.key;
    }
    const createSonarProject = {
      githubProjectId: githubId,
      githubFullName: githubProject.fullName,
      sonarProjectKey: sonarProjectKey,
    };
    await SonarCloudProject.create(createSonarProject);
  } else {
    // sonar project exists
    sonarProjectKey = sonarProject.sonarProjectKey;
    if (sonarProject.analysisDate) {
      return;
    }
  }
  const url = `${sonarScanHost}/sonar/scan`;
  const body = {
    gitOwner: githubProject.ownerName,
    repoName: githubProject.name,
    sonarOrg: process.env.SONAR_ORG_NAME,
    sonarKey: sonarProjectKey,
    sonarHostUrl: 'https://sonarcloud.io',
    language: githubProject.language,
    id: githubId,
    sonarToken: process.env.SONAR_CLOUD_TOKEN,
  };
  await fetch(url, {
    method: 'post',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function deleteSonarByKeys(req, res) {
  const keys = req.body;
  if (!keys?.length) {
    res.status(200).json({ msg: 'empty' });
  }
  const sonarCloudSdk = new SonarCloudSdk();
  for (let key of keys) {
    await sonarCloudSdk.deleteProject(key);
    await sonarCloudProject.destroy({
      where: {
        sonarProjectKey: key,
      },
    });
  }
  res.status(200).json({ msg: 'success' });
}

export async function createSonarProjectsFromGithub(req, res) {
  const githubIds = req.body;
  const sonarCloudSdk = new SonarCloudSdk();
  for (const githubId of githubIds) {
    try {
      const githubProject = await GithubProjects.findOne({
        where: {
          id: githubId,
        },
      });

      if (!githubProject) {
        continue;
      }

      //   query for sonar
      let sonarProject = await SonarCloudProject.findOne({
        where: {
          githubProjectId: githubId,
        },
      });
      if (sonarProject) {
        if (sonarProject.analysisDate) {
          logger.info(`sonarProject:{${sonarProject.sonarProjectKey}} has analysis finished!`);
          continue;
        } else {
          await collectSonarCloudDataBySonarKeys([sonarProject.sonarProjectKey]);
          sonarProject = await SonarCloudProject.findOne({
            where: {
              githubProjectId: githubId,
            },
          });
          if (sonarProject.analysisDate) {
            continue;
          } else {
            logger.info(`delete sonarCloud project ${githubProject.fullName} , create a new one`);
            if (sonarProject.sonarProjectKey) {
              await sonarCloudSdk.deleteProject(sonarProject.sonarProjectKey);
            }
          }
        }
      } else {
        const sonarProject4Db = {
          githubProjectId: githubId,
          githubFullName: githubProject.fullName,
          sonarOrg: process.env.SONAR_GITHUB_FORK_ORG_NAME,
          sonarProjectKey: `${process.env.SONAR_GITHUB_FORK_ORG_NAME}_${githubProject.fullName.replaceAll('/', '-')}`,
        };
        await SonarCloudProject.create(sonarProject4Db);
        logger.info(
          `create sonar db project. githubId:${githubId},sonarKey:${sonarProject4Db.sonarProjectKey}`,
        );
        sonarProject = sonarProject4Db;
      }
      //   create sonar project
      if (!sonarProject?.forkGithubFullName) {
        const githubSdk = new GithubSdk();
        const infoResult = await githubSdk.projectInfo(
          process.env.SONAR_GITHUB_FORK_ORG_NAME,
          githubProject.fullName.replace('/', '-'),
        );
        logger.info(
          `try to get github fork project info. fullName:{${process.env.SONAR_GITHUB_FORK_ORG_NAME}/${githubProject.fullName.replace('/', '-')}}`,
        );

        // get fork repo info
        if (infoResult.ok) {
          logger.info(
            `success to get github fork project info. fullName:{${process.env.SONAR_GITHUB_FORK_ORG_NAME}/${githubProject.fullName.replace('/', '-')}}`,
          );
          const updateInfo = {
            forkGithubId: infoResult.data.id,
            forkGithubFullName: infoResult.data.full_name,
            sonarProjectKey: `${process.env.SONAR_GITHUB_FORK_ORG_NAME}_${githubProject.fullName.replaceAll('/', '-')}`,
            sonarOrg: process.env.SONAR_GITHUB_FORK_ORG_NAME,
            defaultBranch: '',
          };
          await SonarCloudProject.update(updateInfo, {
            where: {
              githubProjectId: githubId,
            },
          });
          sonarProject.forkGithubFullName = infoResult.data.full_name;
          sonarProject.forkGithubId = infoResult.data.id;
          sonarProject.sonarProjectKey = updateInfo.sonarProjectKey;
        } else {
          logger.error(
            // eslint-disable-next-line max-len
            `failed to get github fork project info. fullName:{${process.env.SONAR_GITHUB_FORK_ORG_NAME}/${githubProject.fullName.replace('/', '-')}} , reason: ${await infoResult.msg()}`,
          );
          continue;
        }
      }
      const createSonarParam = {
        newCodeDefinitionType: 'previous_version',
        newCodeDefinitionValue: 'previous_version',
        organization: process.env.SONAR_GITHUB_FORK_ORG_NAME,
        projects: [
          {
            repoName: sonarProject.forkGithubFullName,
            projectId: sonarProject.forkGithubId,
          },
        ],
      };
      const createSonarResult = await sonarCloudSdk.createProjectInternalApi(createSonarParam);
      logger.info(`create sonarCloud project of sonarKey:{${JSON.stringify(createSonarParam)}}`);
      if (createSonarResult.ok) {
        logger.info(
          `success created sonarCloud project of sonarKey:{${JSON.stringify(createSonarParam)}}`,
        );
        await sleep(5 * 1000);
        //   active auto scan
        await sonarCloudSdk.setAutoScanInternalApi(sonarProject.sonarProjectKey, true);
        const activeResult = await sonarCloudSdk.activeAutoScanInternalApi(
          sonarProject.sonarProjectKey,
        );
        if (activeResult.ok) {
          logger.info(`active auto scan of {${sonarProject.sonarProjectKey}} success!`);
          timer(collectSonarCloudDataBySonarKeys, [sonarProject.sonarProjectKey], 1000 * 60 * 10);
        } else {
          logger.error(
            `failed to active auto scan of project :${sonarProject.sonarProjectKey} , ${await activeResult.text()}`,
          );
        }
        await sleep(3 * 1000);
      } else {
        logger.error(
          `failed to sonarCloud project of sonarKey:{${JSON.stringify(createSonarParam)}}`,
        );
      }
    } catch (error) {
      logger.error(error);
    }
  }
  res.status(200);
  res.json({ ok: true });
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
      logger.error(`${response.status}:${await response.text()}`);
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
    logger.info(`create gitlab project ${count} / ${paramProjectIds.length}`);
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
      logger.error(`${response.status}:${await response.text()}`);
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
      logger.error(`${response.status}:${await response.text()}`);
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
      logger.error(`get sonar project branches info failed`, await response.text());
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
          logger.error(`delete sonar project branch failed`, await response.text());
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
      logger.error(
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
