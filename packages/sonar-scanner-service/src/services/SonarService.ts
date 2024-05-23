import type { GitCloneParam, SonarScanParam } from '../interfaces/RepoInfo';
import { WorkerPool } from '../worker/workerPool.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'path';
import type { GitCloneResult } from '../worker/gitWorker';
import type { SonarScanResult } from '../worker/sonarScannerWorker';
import process from 'node:process';
import type { SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';

// thread pool for git and sonar scanner
const sonarScannerWorkerPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../worker/sonarScannerWorker.js',
);
const gitWorkerPath = join(dirname(fileURLToPath(import.meta.url)), '../worker/gitWorker.js');
const sonarScannerThreadPool = new WorkerPool<SonarScanParam, SonarScanResult>(
  'sonar scanner workers',
  sonarScannerWorkerPath,
  2,
);
const gitThreadPool = new WorkerPool<GitCloneParam, GitCloneResult>(
  'git clone workers',
  gitWorkerPath,
  1,
);

export async function scan(info: SonarScanParam) {
  return gitThreadPool
    .run({
      owner: info.gitOwner,
      repoName: info.repoName,
      pullIfExists: true,
      sonarKey: info.sonarKey,
    })
    .then(result => {
      return result.ok
        ? Promise.resolve(result)
        : Promise.reject(`repo ${result?.fullRepoName} clone/pull failed , dont sonar scan`);
    })
    .then(cloneResult => {
      return getDefaultBranchName(cloneResult.dir);
    })
    .then(branchName => {
      updateDefaultBranch(info.sonarKey, branchName);
    })
    .then(() => {
      return sonarScannerThreadPool.run(info);
    })
    .then(sonarScanResult => {
      return sonarScanResult?.ok
        ? Promise.resolve(sonarScanResult)
        : Promise.reject(
            `sonarKey:${sonarScanResult.sonarKey} sonar scan failed , reason:${sonarScanResult.msg}`,
          );
    })
    .catch(e => {
      console.error(e);
    });
}

export async function getDefaultBranch(cloneInfo: GitCloneParam) {
  gitThreadPool
    .run(cloneInfo)
    .then(cloneResult => {
      return cloneResult?.ok
        ? Promise.resolve(cloneResult)
        : Promise.reject(`repo ${cloneResult.fullRepoName} clone/pull failed , dont sonar scan`);
    })
    .then(cloneResult => {
      return getDefaultBranchName(cloneResult.dir);
    })
    .then(branchName => updateDefaultBranch(cloneInfo.sonarKey, branchName))
    .catch(e => {
      console.error(e);
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
