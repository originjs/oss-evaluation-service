import { parentPort } from 'worker_threads';
import type { GitCloneParam } from '../interfaces/RepoInfo';
import fs from 'node:fs';
import process from 'node:process';
import type { SimpleGit, SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import { existsSync, mkdirSync } from 'fs';

function getNotHiddenFileCount(dir: string) {
  const files = fs.readdirSync(dir);
  return files.filter(file => !file.startsWith('.')).length;
}

export interface GitCloneResult {
  ok: boolean;
  fullRepoName: string;
  dir: string;
}

export async function cloneRepoIfNotExist(cloneInfo: GitCloneParam): Promise<GitCloneResult> {
  const owner = cloneInfo.owner;
  const repoName = cloneInfo.repoName;
  const pullIfExists = cloneInfo.pullIfExists;
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
  // retry 3 times for clone
  for (let i = 0; i < 3; i++) {
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

    // check valid after clone/pull
    const notHiddenFileCount = getNotHiddenFileCount(dir);
    if (notHiddenFileCount === 0) {
      //   git clone failed , delete the dir
      fs.rmSync(dir, { recursive: true, force: true });
      console.info(`clone/pull ${dir} failed , retry count: ${i + 1}`);
    } else {
      return { ok: true, fullRepoName: `${owner}/${repoName}`, dir };
    }
  }
  return { ok: false, fullRepoName: `${owner}/${repoName}`, dir };
}

function getGitCloneUrl(owner: string, repoName: string) {
  return `https://github.com/${owner}/${repoName}.git`;
}

parentPort.on('message', gitCloneInfo => {
  cloneRepoIfNotExist(gitCloneInfo).then(cloneResult => {
    parentPort.postMessage(cloneResult);
  });
});
