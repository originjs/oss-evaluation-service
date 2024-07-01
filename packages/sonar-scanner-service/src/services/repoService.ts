import type { GitCloneParam } from '../interfaces/param';
import { gitCloneThreadPool, shellThreadPool } from '../worker/workers.js';
import { logger } from '@orginjs/oss-evaluation-data-model';

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
    const url = process.env.INTEGRATION_URL;
    if (!url) {
      logger.error('no ${INTEGRATION_URL} env config, skip local repo cloc');
      return;
    }
    const updateUrl = `${url}/sync/setProjectCodeLines`;
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: repoInfo.projectId,
        codeLines: codeLines,
      }),
    });

    if (response.ok) {
      logger.info(
        `${repoInfo.owner}/${repoInfo.repoName} cloc codeLines success,codeLines=${codeLines}`,
      );
    } else {
      logger.error(
        `${repoInfo.owner}/${repoInfo.repoName} cloc codeLines failed,error:${await response.text()}`,
      );
    }
  }
}
