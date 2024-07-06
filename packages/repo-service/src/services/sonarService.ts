import type { GitCloneParam, SonarScanParam } from '../interfaces/param';
import process from 'node:process';
import type { SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import { logger, SonarCloudProject } from '@orginjs/oss-evaluation-data-model';
import { gitCloneThreadPool, sonarScannerThreadPool } from '../worker/workers.js';
import { getLanguageServiceImpl } from './sonarLanguageService.js';
import SonarCloudSdk from '@orginjs/sonar-cloud-sdk';

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

export async function scan(info: SonarScanParam) {
  // throw err if language dont support
  try {
    getLanguageServiceImpl(info);
  } catch (e) {
    logger.warn(e.message);
    return;
  }
  gitCloneThreadPool
    .run({
      owner: info.gitOwner,
      repoName: info.repoName,
      pullIfExists: false,
      sonarKey: info.sonarKey,
      shadowClone: true,
    })
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(data => getDefaultBranchName(`${process.env.REPO_DIR}/${data.owner}/${data.repoName}`))
    .then(branchName => updateDefaultBranch(info.sonarKey, branchName))
    .then(() => sonarScannerThreadPool.run(info))
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(() => sleep(5000))
    .then(() => {
      logger.info(`try to collect sonar ${JSON.stringify([info.sonarKey])}`);
      return fetch(`${process.env.INTEGRATION_URL}/sync/sonarCloud/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([info.sonarKey]),
      });
    })
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

export async function getDefaultBranch(cloneInfo: GitCloneParam) {
  gitCloneThreadPool
    .run(cloneInfo)
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(data => getDefaultBranchName(`${process.env.REPO_DIR}/${data.owner}/${data.repoName}`))
    .then(branchName => updateDefaultBranch(cloneInfo.sonarKey, branchName))
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

async function updateDefaultBranch(sonarProjectKey: string, defaultBranch: string) {
  const sonarProject = await SonarCloudProject.findOne({
    where: {
      sonarProjectKey,
    },
  });

  if (sonarProject.defaultBranch !== defaultBranch) {
    const sonarCloudSdk = new SonarCloudSdk();
    const listSonarBranches = await sonarCloudSdk.listProjectBranches(sonarProjectKey);
    if (!listSonarBranches.ok) {
      logger.warn(`get sonar project branches info failed`, await listSonarBranches.text());
    }
    const sonarBranches = (await listSonarBranches.json()).branches;
    const mainBranch = sonarBranches.find(item => item.isMain);
    if (sonarBranches.length > 1) {
      //   delete all non-primary branches
      for (const branch of sonarBranches.filter(item => !item.isMain)) {
        const deleteResponse = await sonarCloudSdk.deleteBranch(sonarProjectKey, branch.name);
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
            sonarProjectKey,
          },
        },
      );
    } else {
      //   change sonar primary branch name to default branch
      const renameResponse = await sonarCloudSdk.renameMainBranch(sonarProjectKey, defaultBranch);
      if (!renameResponse.ok) {
        logger.warn(
          `rename sonar project:${sonarProjectKey} branch:${mainBranch.name} to ${defaultBranch}`,
          await renameResponse.text(),
        );
      }
      await SonarCloudProject.update(
        {
          defaultBranch: defaultBranch,
        },
        {
          where: {
            sonarProjectKey,
          },
        },
      );
    }
  }
}
