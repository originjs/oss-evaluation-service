import { parentPort } from 'worker_threads';
import type { GitRepoInfo, RepoCloneParam } from '../interfaces/param';
import fs from 'node:fs';
import process from 'node:process';
import type { SimpleGit, SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import { existsSync, mkdirSync } from 'fs';
import { Result } from '../utils/result.js';
import { logger } from '@orginjs/oss-evaluation-data-model';
import { platformTypes } from '@orginjs/oss-evaluation-util';

function getNotHiddenFileCount(dir: string) {
  const files = fs.readdirSync(dir);
  return files.filter(file => !file.startsWith('.')).length;
}

export async function cloneRepoIfNotExist(cloneInfo: RepoCloneParam): Promise<Result<GitRepoInfo>> {
  const owner = cloneInfo.owner;
  const repoName = cloneInfo.repoName;
  const platformType = cloneInfo.platformType;
  const pullIfExists = cloneInfo.pullIfExists;
  const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
  const options: Partial<SimpleGitOptions> = {
    baseDir: dir,
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  };
  // retry 3 times for clone
  for (let i = 0; i < 2; i++) {
    const exists = existsSync(dir);
    const retryUrl = getCloneUrlByTime(i + 1, owner, repoName, platformType);
    // create folder if dont exists
    if (!exists) {
      mkdirSync(dir, { recursive: true });
    }
    // skip ask username and password , avoid hang
    const gitClient: SimpleGit = simpleGit(options).env('GIT_TERMINAL_PROMPT', '0');
    const isRepo = await gitClient.checkIsRepo();
    if (isRepo) {
      logger.info(`${owner}/${repoName} exists`);
      if (pullIfExists) {
        await pull(cloneInfo, gitClient);
      }
    } else {
      logger.info(`${owner}/${repoName} dont exists,git clone`);
      await clone(cloneInfo, retryUrl, gitClient);
    }

    // check valid after clone/pull
    const notHiddenFileCount = getNotHiddenFileCount(dir);
    if (notHiddenFileCount === 0) {
      //   git clone failed , delete the dir
      logger.info(`clone/pull ${dir} failed , retry count: ${i + 1}`);
      fs.rmSync(dir, { recursive: true, force: true });
    } else {
      logger.info(`${owner}/${repoName}:${retryUrl} clone success`);
      return Result.ok(cloneInfo);
    }
  }
  throw new Error(`clone repo failed:${JSON.stringify(cloneInfo)}`);
}

async function clone(cloneInfo: RepoCloneParam, retryUrl: string, gitClient: SimpleGit) {
  try {
    const options = cloneInfo.shadowClone ? { '--depth': 1 } : {};
    await gitClient.clone(retryUrl, '.', options);
  } catch (e) {
    logger.error(`${cloneInfo.owner}/${cloneInfo.repoName}:${retryUrl} clone failed! ${e}`);
  }
}

async function pull(cloneInfo: RepoCloneParam, gitClient: SimpleGit) {
  try {
    await gitClient.pull();
    return true;
  } catch (e) {
    logger.warn(`${cloneInfo.owner}/${cloneInfo.repoName} pull failed`);
    return false;
  }
}

function getCloneUrlByTime(
  time: number,
  owner: string,
  repoName: string,
  platformType: number = platformTypes.GITHUB,
): string {
  const repoBaseUrlMap = {
    [platformTypes.GITHUB]: 'github.com',
    [platformTypes.GITEE]: 'gitee.com',
    [platformTypes.GITCODE]: 'gitcode.com',
  };
  const baseUrl = repoBaseUrlMap[platformType];
  //   1: origin url
  //   2: use ssh clone
  switch (time) {
    case 1:
      return `https://${baseUrl}/${owner}/${repoName}.git`;
    case 2:
      return `git@${baseUrl}:${owner}/${repoName}.git`;
  }
}

parentPort.on('message', gitCloneInfo => {
  try {
    cloneRepoIfNotExist(gitCloneInfo)
      .then(cloneResult => parentPort.postMessage(cloneResult))
      .catch(e => parentPort.postMessage(Result.fail(e.message)));
  } catch (e) {
    parentPort.postMessage(Result.fail(e.message));
  }
});
