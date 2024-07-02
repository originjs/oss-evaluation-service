import type { GitCloneParam, SonarScanParam } from '../interfaces/param';
import process from 'node:process';
import type { SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import { logger } from '@orginjs/oss-evaluation-data-model';
import { gitCloneThreadPool, sonarScannerThreadPool } from '../worker/workers.js';

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

export async function scan(info: SonarScanParam) {
  return gitCloneThreadPool
    .run({
      owner: info.gitOwner,
      repoName: info.repoName,
      pullIfExists: false,
      sonarKey: info.sonarKey,
    })
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(data => getDefaultBranchName(`${process.env.REPO_DIR}/${data.owner}/${data.repoName}`))
    .then(branchName => updateDefaultBranch(info.sonarKey, branchName))
    .then(() => sonarScannerThreadPool.run(info))
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(() => sleep(5000))
    .then(() => {
      logger.info(`try to collect sonar ${JSON.stringify([info.sonarKey])}`);
      return fetch(`${process.env.INTEGRATION_HOST}/sync/sonarCloud/collect`, {
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
  await fetch(`${process.env.INTEGRATION_HOST}/sync/sonarCloud/setDefaultBranchOfSonar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sonarProjectKey,
      defaultBranch,
    }),
  });
}
