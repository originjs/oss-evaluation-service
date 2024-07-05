import type { GitCloneParam } from '../interfaces/param';
import { gitCloneThreadPool, shellThreadPool } from '../worker/workers.js';
import { logger, GithubProjectsTable } from '@orginjs/oss-evaluation-data-model';

export async function getCodeLines(repoInfo: GitCloneParam) {
  repoInfo.shadowClone = true;
  repoInfo.pullIfExists = false;
  gitCloneThreadPool
    .run(repoInfo)
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(result => getClocCommand(result))
    .then(command => shellThreadPool.run(command))
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(stdout => updateCodeLinesOfProject(Number(stdout.trim()), repoInfo))
    .catch(err => logger.error(err));
}

function getClocCommand(repoInfo: GitCloneParam): string {
  const dir = `${process.env.REPO_DIR}/${repoInfo.owner}/${repoInfo.repoName}`;
  const cdCommand = `cd ${dir}`;
  // timeout = 0 to allow unlimited time
  const clocCommand = `cloc --timeout 0 . | awk '/SUM:/ {print $5}'`;
  return `
  ${cdCommand} && \
  ${clocCommand}
  `;
}

async function updateCodeLinesOfProject(codeLines: number, repoInfo: GitCloneParam) {
  if (codeLines > 0 && repoInfo.projectId) {
    await GithubProjectsTable.update(
      { codeSize: codeLines },
      {
        where: {
          id: repoInfo.projectId,
        },
      },
    );
    logger.info(
      `${repoInfo.owner}/${repoInfo.repoName} cloc codeLines success,codeLines=${codeLines}`,
    );
  }
}
