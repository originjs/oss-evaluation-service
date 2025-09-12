import type { RepoCloneParam } from '../interfaces/param.js';
import { gitCloneThreadPool, shellThreadPool } from '../worker/workers.js';
import {
  logger,
  GithubProjectsTable,
  GiteeProjectsTable,
  GitcodeProjectsTable,
} from '@orginjs/oss-evaluation-data-model';
import { platformTypes } from '@orginjs/oss-evaluation-util';

export async function getCodeLines(repoInfo: RepoCloneParam) {
  repoInfo.shadowClone = true;
  repoInfo.pullIfExists = false;
  gitCloneThreadPool
    .run(repoInfo)
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(result => getClocCommand(result))
    .then(command => shellThreadPool.run(command))
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(stdout => updateCodeLinesOfProject(Number(stdout.trim()), repoInfo))
    .then(() => getCleanupCommand(repoInfo))
    .then(command => shellThreadPool.run(command))
    .catch(err => logger.error(err));
}

function getCleanupCommand(repoInfo: RepoCloneParam): string {
  const dir = `${process.env.REPO_DIR}/${repoInfo.owner}/${repoInfo.repoName}`;
  return `rm -rf ${dir}`;
}

function getClocCommand(repoInfo: RepoCloneParam): string {
  const dir = `${process.env.REPO_DIR}/${repoInfo.owner}/${repoInfo.repoName}`;
  const cdCommand = `cd ${dir}`;
  // timeout = 0 to allow unlimited time
  const clocCommand = `cloc --timeout 0 . | awk '/SUM:/ {print $5}'`;
  return `
  ${cdCommand} && \
  ${clocCommand}
  `;
}

async function updateCodeLinesOfProject(codeLines: number, repoInfo: RepoCloneParam) {
  if (codeLines > 0 && repoInfo.pId) {
    const tableMap = {
      [platformTypes.GITHUB]: GithubProjectsTable,
      [platformTypes.GITEE]: GiteeProjectsTable,
      [platformTypes.GITCODE]: GitcodeProjectsTable,
    };
    const table = tableMap[repoInfo.platformType || platformTypes.GITHUB];
    await table.update(
      { codeSize: codeLines },
      {
        where: {
          pId: repoInfo.pId,
        },
      },
    );
    logger.info(
      `${repoInfo.owner}/${repoInfo.repoName} cloc codeLines success,codeLines=${codeLines}`,
    );
  }
}
