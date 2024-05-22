import type { SimpleGit, SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import type { SonarScanParam } from '../interfaces/RepoInfo';
import { existsSync, mkdirSync } from 'fs';
import * as process from 'node:process';
import { WorkerPool } from '../worker/workerPool.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'path';
import * as fs from 'node:fs';

const workPath = join(dirname(fileURLToPath(import.meta.url)), '../worker/sonarWorks.js');
const workerPool = new WorkerPool(workPath, 4);

export async function scan(info: SonarScanParam) {
  const owner = info.gitOwner;
  const repoName = info.repoName;
  const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
  await cloneRepoIfNotExist(owner, repoName, true);
  // get files, if only .git folder , try to clone of pull
  const notHiddenFileCount = getNotHiddenFileCount(dir);
  if (notHiddenFileCount == 0) {
    return false;
  }
  workerPool
    .run(info)
    .then(sonarKey => {
      console.log(`${sonarKey} has scan finished!!`);
    })
    .catch(e => {
      console.error(`${info.sonarKey} scan failed! , ${e}`);
    });
  return true;
}

function getNotHiddenFileCount(dir: string) {
  const files = fs.readdirSync(dir);
  return files.filter(file => !file.startsWith('.')).length;
}

export async function getDefaultBranch(owner: string, repoName: string) {
  const gitClient = await cloneRepoIfNotExist(owner, repoName, false);
  const branchSummary = await gitClient.branch();
  const branchInfos = branchSummary.branches;
  //   return the default branch
  return Object.values(branchInfos).filter(branch => branch.current)[0].name;
}

export async function cloneRepoIfNotExist(owner: string, repoName: string, pullIfExists: boolean) {
  const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
  const useGhProxy = JSON.parse(process.env.GH_PROXY ?? 'false');
  const gitCloneUrl = getGitCloneUrl(owner, repoName);
  const cloneUrl = useGhProxy
    ? `https://gitclone.com/github.com/${owner}/${repoName}.git`
    : gitCloneUrl;
  const options: Partial<SimpleGitOptions> = {
    baseDir: dir,
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  };
  const exists = existsSync(dir);
  if (!exists) {
    mkdirSync(dir, { recursive: true });
  }
  const gitClient: SimpleGit = simpleGit(options);
  const isRepo = await gitClient.checkIsRepo();
  if (isRepo) {
    console.log(`${owner}/${repoName} exists`);
    if (pullIfExists) {
      await gitClient.pull();
    }
  } else {
    console.log(`${owner}/${repoName} dont exists,git clone`);
    await gitClient.clone(cloneUrl, '.', ['--depth', '1']);
  }
  return gitClient;
}


function getGitCloneUrl(owner: string, repoName: string) {
  return `https://github.com/${owner}/${repoName}.git`;
}
