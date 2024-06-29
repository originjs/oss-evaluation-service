import { parentPort } from 'worker_threads';
import type { GitCloneParam } from '../interfaces/param';
import fs from 'node:fs';
import process from 'node:process';
import type { SimpleGit, SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import { existsSync, mkdirSync } from 'fs';
import { Result } from '../utils/result.js';
import { logger } from '@orginjs/oss-evaluation-data-model';

function getNotHiddenFileCount(dir: string) {
  const files = fs.readdirSync(dir);
  return files.filter(file => !file.startsWith('.')).length;
}

export async function cloneRepoIfNotExist(
  cloneInfo: GitCloneParam,
): Promise<Result<GitCloneParam>> {
  const owner = cloneInfo.owner;
  const repoName = cloneInfo.repoName;
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
    const cloneUrl = getCloneUrlByTime(i + 1, owner, repoName);
    if (!exists) {
      mkdirSync(dir, { recursive: true });
    }
    const gitClient: SimpleGit = simpleGit(options);
    let isRepo = false;
    try {
      isRepo = await gitClient.checkIsRepo();
    } catch (e){ /* empty */ }
    if (isRepo) {
      logger.info(`${owner}/${repoName} exists`);
      if (pullIfExists) {
        try {
          await gitClient.pull();
        } catch (e) {
          logger.warn(`${owner}/${repoName} pull failed,but it doesn't affect sonar scan.`);
        }
      }
    } else {
      logger.info(`${owner}/${repoName} dont exists,git clone`);
      try {
        await gitClient.clone(cloneUrl, '.');
      } catch (e) {
        logger.error(`${owner}/${repoName}:${cloneUrl} clone failed! ${e}`);
        continue;
      }
    }

    // check valid after clone/pull
    const notHiddenFileCount = getNotHiddenFileCount(dir);
    if (notHiddenFileCount === 0) {
      //   git clone failed , delete the dir
      logger.info(`clone/pull ${dir} failed , retry count: ${i + 1}`);
      fs.rmSync(dir, { recursive: true, force: true });
    } else {
      logger.info(`${owner}/${repoName}:${cloneUrl} clone success`);
      return Result.ok(cloneInfo);
    }
  }
  throw new Error(`clone repo failed:${JSON.stringify(cloneInfo)}`);
}

function getCloneUrlByTime(time: number, owner: string, repoName: string): string {
  //   1: origin url
  //   2: gitclone.com/github.com/xxx/xxx
  //   3: use ssh clone
  switch (time) {
    case 1:
      return `https://github.com/${owner}/${repoName}.git`;
    case 2:
      return `git@github.com:${owner}/${repoName}.git`;
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
