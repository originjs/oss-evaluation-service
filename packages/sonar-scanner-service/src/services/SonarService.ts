import type { GitCloneParam, SonarScanParam } from '../interfaces/RepoInfo';
import { WorkerPool } from '../worker/workerPool.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'path';
import process from 'node:process';
import type { SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import type { Result } from '../utils/result';

// thread pool for git and sonar scanner
const sonarScannerWorkerPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../worker/sonarScannerWorker.js',
);
const gitWorkerPath = join(dirname(fileURLToPath(import.meta.url)), '../worker/gitWorker.js');
const sonarScannerThreadPool = new WorkerPool<SonarScanParam, Result<SonarScanParam>>(
  'sonar scanner workers',
  sonarScannerWorkerPath,
  2,
);
const gitThreadPool = new WorkerPool<GitCloneParam, Result<GitCloneParam>>(
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
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(data => getDefaultBranchName(`${process.env.REPO_DIR}/${data.owner}/${data.repoName}`))
    .then(branchName => updateDefaultBranch(info.sonarKey, branchName))
    .then(() => sonarScannerThreadPool.run(info))
    .catch(e => {
      console.error(e);
    });
}

export async function getDefaultBranch(cloneInfo: GitCloneParam) {
  gitThreadPool
    .run(cloneInfo)
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(data => getDefaultBranchName(`${process.env.REPO_DIR}/${data.owner}/${data.repoName}`))
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
