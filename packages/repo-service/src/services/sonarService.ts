import type { GitRepoInfo, SonarScanParam } from '../interfaces/param';
import process from 'node:process';
import type { SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import { logger, SonarCloudProject } from '@orginjs/oss-evaluation-data-model';
import { gitCloneThreadPool, sonarScannerThreadPool } from '../worker/workers.js';
import GithubSdk from '@orginjs/github-sdk';
import SonarCloudSdk from '@orginjs/sonar-cloud-sdk';
import { platformTypes } from '@orginjs/oss-evaluation-util';

const sonarCloudSdk = new SonarCloudSdk();
const githubSdk = new GithubSdk(process.env.GITHUB_FORK_TOKEN);

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

export async function scan(info: SonarScanParam) {
  const language = info.language.toUpperCase();
  if (language === 'RUST' || language === 'OBJECT-C') {
    logger.warn(`sonar dont support for ${language} of ${info.fullName}`);
    return;
  }
  gitCloneThreadPool
    .run({
      owner: info.owner,
      repoName: info.repoName,
      platformType: info.platformType,
      pullIfExists: false,
      shadowClone: true,
    })
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(data => getDefaultBranchName(`${process.env.REPO_DIR}/${data.owner}/${data.repoName}`))
    .then(branchName => updateDefaultBranch(info.sonarKey, branchName))
    .then(() => sonarScannerThreadPool.run(info))
    .then(async result => {
      if (result.ok) {
        // sonar scan success
        return Promise.resolve(result.data);
      } else {
        // failed to local sonar scan , try to fork and auto scan
        const forkGithubInfo = await createGithubFork(info);
        // active auto sonar scan
        await activeAutoSonarScan(forkGithubInfo, info);
      }
    })
    .then(() => sleep(5000))
    .then(() => collectSonarScanData(info.sonarKey))
    .then(collectResult => collectResult.json())
    .then(data => {
      if (data.ok) {
        logger.info(`collect sonar project:${info.sonarKey} success`);
      } else {
        logger.error(`collect sonar project:${info.sonarKey} failed`);
      }
    })
    .catch(e => {
      logger.error(e);
    });
}

function collectSonarScanData(sonarKey: string) {
  logger.info(`try to collect sonar ${JSON.stringify([sonarKey])}`);
  return fetch(`${process.env.INTEGRATION_URL}/sync/sonarCloud/collect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([sonarKey]),
  });
}

async function createGithubFork(info: SonarScanParam): Promise<GitRepoInfo> {
  const sonarProject = await SonarCloudProject.findOne({
    where: {
      pId: info.pId,
    },
  });
  const forkGithubToken = process.env.GITHUB_FORK_TOKEN;
  const forkOrgName = process.env.GITHUB_FORK_ORG_NAME;
  const repoName = `${info.owner}-${info.repoName}`;
  const fullName = `${forkOrgName}/${repoName}`;
  if (sonarProject?.forkPId != -1) {
    return {
      pId: sonarProject.forkPId,
      owner: forkOrgName,
      repoName,
      fullName,
    };
  }
  if (!forkGithubToken || !forkOrgName) {
    logger.warn(
      `no \${GITHUB_FORK_TOKEN} or \${GITHUB_FORK_ORG_NAME} env config,skip fork github and auto sonar scan!`,
    );
  }
  // create github fork
  const response = await githubSdk.createFork(info.owner, info.repoName, {
    name: repoName,
    organization: forkOrgName,
    default_branch_only: true,
  });
  if (response.ok) {
    const forkData = await response.json();
    const forkPId = `${platformTypes.GITHUB}#${forkData.id}`;
    // update sonar project info
    await SonarCloudProject.update(
      {
        forkPId,
        forkGithubFullName: fullName,
        sonarOrg: forkOrgName,
        // remove default branch
        defaultBranch: '',
      },
      {
        where: {
          pId: info.pId,
        },
      },
    );
    return {
      pId: forkPId,
      owner: forkOrgName,
      repoName: repoName,
      fullName: fullName,
    };
  } else {
    const errMsg = `create ${info.owner}/${info.repoName} failed , err:${await response.text()}`;
    logger.error(errMsg);
    throw new Error(errMsg);
  }
}

async function activeAutoSonarScan(repoInfo: GitRepoInfo, sonarScanInfo: SonarScanParam) {
  const createSonarParam = {
    newCodeDefinitionType: 'previous_version',
    newCodeDefinitionValue: 'previous_version',
    organization: process.env.GITHUB_FORK_ORG_NAME,
    projects: [
      {
        repoName: repoInfo.fullName,
        pId: repoInfo.pId,
      },
    ],
  };
  const createSonarResult = await sonarCloudSdk.createProjectInternalApi(createSonarParam);
  if (createSonarResult.ok) {
    // update sonar key
    const sonarKey = createSonarResult.data?.projects[0]?.projectKey;
    await SonarCloudProject.update(
      {
        sonarProjectKey: sonarKey,
      },
      {
        where: {
          forkPId: repoInfo.pId,
        },
      },
    );
    logger.info(
      `success created sonarCloud project of sonarKey:{${JSON.stringify(createSonarParam)}}`,
    );
    await sleep(5 * 1000);
    const branchName = await getDefaultBranchName(
      `${process.env.REPO_DIR}/${sonarScanInfo.owner}/${sonarScanInfo.repoName}`,
    );
    await updateDefaultBranch(sonarKey, branchName);
    //   active auto scan
    const activeResult = await sonarCloudSdk.activeAutoScanInternalApi(sonarKey);
    if (activeResult.ok) {
      logger.info(`active auto scan of {${sonarKey}} success!`);
      setTimeout(() => collectSonarScanData(sonarKey), 10 * 60 * 1000);
    } else {
      logger.error(
        `failed to active auto scan of project :${sonarKey} , ${await activeResult.text()}`,
      );
    }
    await sleep(3 * 1000);
  } else {
    logger.error(`failed to sonarCloud project of sonarKey:{${JSON.stringify(createSonarParam)}}`);
  }
}

export async function getDefaultBranch(sonarScanParam: SonarScanParam) {
  gitCloneThreadPool
    .run(sonarScanParam)
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(data => getDefaultBranchName(`${process.env.REPO_DIR}/${data.owner}/${data.repoName}`))
    .then(branchName => updateDefaultBranch(sonarScanParam.sonarKey, branchName))
    .catch(e => {
      logger.error(e);
    });
}

async function getDefaultBranchName(dir: string) {
  const options: Partial<SimpleGitOptions> = {
    baseDir: dir,
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  };
  const gitClient = simpleGit(options);
  const branches = (await gitClient.branch())?.branches;
  return Object.values(branches).filter(branch => branch.current)[0].name;
}

async function updateDefaultBranch(sonarKey: string, defaultBranch: string) {
  const sonarProject = await SonarCloudProject.findOne({
    where: {
      sonarProjectKey: sonarKey,
    },
  });

  if (sonarProject.defaultBranch !== defaultBranch) {
    const listSonarBranches = await sonarCloudSdk.listProjectBranches(sonarKey);
    if (!listSonarBranches.ok) {
      logger.warn(`get sonar project branches info failed`, await listSonarBranches.text());
    }
    const sonarBranches = (await listSonarBranches.json()).branches;
    const mainBranch = sonarBranches.find(item => item.isMain);
    if (sonarBranches.length > 1) {
      //   delete all non-primary branches
      for (const branch of sonarBranches.filter(item => !item.isMain)) {
        const deleteResponse = await sonarCloudSdk.deleteBranch(sonarKey, branch.name);
        if (!deleteResponse.ok) {
          logger.warn(`delete sonar project branch failed`, await listSonarBranches.text());
        }
      }
    }
    if (mainBranch.name === defaultBranch) {
      await SonarCloudProject.update(
        {
          defaultBranch: defaultBranch,
        },
        {
          where: {
            sonarProjectKey: sonarKey,
          },
        },
      );
    } else {
      //   change sonar primary branch name to default branch
      const renameResponse = await sonarCloudSdk.renameMainBranch(sonarKey, defaultBranch);
      if (!renameResponse.ok) {
        logger.warn(
          `rename sonar project:${sonarKey} branch:${mainBranch.name} to ${defaultBranch}`,
          await renameResponse.text(),
        );
      }
      await SonarCloudProject.update(
        {
          defaultBranch: defaultBranch,
        },
        {
          where: {
            sonarProjectKey: sonarKey,
          },
        },
      );
    }
  }
}
