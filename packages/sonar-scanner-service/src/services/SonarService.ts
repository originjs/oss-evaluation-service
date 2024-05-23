import type { GitCloneParam, SonarScanParam } from '../interfaces/RepoInfo';
import { WorkerPool } from '../worker/workerPool.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'path';
import type { GitCloneResult } from '../worker/gitWorker';
import { Promise } from 'workerpool';
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
  sonarScannerWorkerPath,
  3,
);
const gitThreadPool = new WorkerPool<GitCloneParam, GitCloneResult>(gitWorkerPath, 3);

export async function scan(info: SonarScanParam) {
  return gitThreadPool
    .run({
      owner: info.gitOwner,
      repoName: info.repoName,
      pullIfExists: true,
      sonarKey: info.sonarKey,
    })
    .then(result => {
      return new Promise<GitCloneResult>((resolve, reject) => {
        if (result.ok) {
          resolve(result);
        } else {
          reject(`repo ${result?.fullRepoName} clone/pull failed , dont sonar scan`);
        }
      });
    })
    .then(() => {
      return sonarScannerThreadPool.run(info);
    })
    .then(sonarScanResult => {
      return new Promise<SonarScanResult>((resolve, reject) => {
        if (sonarScanResult.ok) {
          resolve(sonarScanResult);
        } else {
          reject(
            `sonarKey:${sonarScanResult.sonarKey} sonar scan failed , reason:${sonarScanResult.msg}`,
          );
        }
      });
    });
}

export async function getDefaultBranch(cloneInfo: GitCloneParam) {
  gitThreadPool
    .run(cloneInfo)
    .then(cloneResult => {
      return new Promise<GitCloneResult>((resolve, reject) => {
        if (cloneResult.ok) {
          resolve(cloneResult);
        } else {
          reject(`repo ${cloneResult.fullRepoName} clone/pull failed , dont sonar scan`);
        }
      });
    })
    .then(cloneResult => {
      const options: Partial<SimpleGitOptions> = {
        baseDir: cloneResult.dir,
        binary: 'git',
        maxConcurrentProcesses: 6,
        trimmed: false,
      };
      const gitClient = simpleGit(options);
      return gitClient.branch();
    })
    .then(branchSummary => {
      const branchInfos = branchSummary.branches;
      //   return the default branch
      return Object.values(branchInfos).filter(branch => branch.current)[0].name;
    })
    .then(branchName => {
      fetch(`${process.env.INTEGRATION_HOST}/sync/sonarCloud/setDefaultBranchOfSonar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sonarProjectKey: cloneInfo.sonarKey,
          defaultBranch: branchName,
        }),
      });
    });
}
