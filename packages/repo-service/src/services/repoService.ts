import type { RepoCloneParam } from '../interfaces/param.js';
import { shellThreadPool } from '../worker/workers.js';
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

  // 使用新的shell worker，内嵌git clone和自动清理
  const shellWithCloneParam = {
    owner: repoInfo.owner,
    repoName: repoInfo.repoName,
    platformType: repoInfo.platformType,
    pullIfExists: false,
    shadowClone: true,
    command: getClocCommand(repoInfo),
    cleanupAfter: true // 执行完命令后自动清理
  };

  shellThreadPool
    .run(shellWithCloneParam)
    .then(result => (result.ok ? Promise.resolve(result.data) : Promise.reject(result.msg)))
    .then(stdout => updateCodeLinesOfProject(Number(stdout.trim()), repoInfo))
    .catch(err => logger.error(err));
}


function getClocCommand(repoInfo: RepoCloneParam): string {
  const dir = `${process.env.REPO_DIR}/${repoInfo.owner}/${repoInfo.repoName}`;
  const cdCommand = `cd ${dir}`;
  // timeout = 0 to allow unlimited time
  const clocCommand = `cloc --timeout 0 . | awk '/SUM:/ {print $5}'`;
  return `${cdCommand} && ${clocCommand}`;
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
  } else {
    // 处理不满足更新条件的情况
    if (!codeLines || codeLines <= 0) {
      logger.warn(
        `${repoInfo.owner}/${repoInfo.repoName} cloc returned invalid codeLines: ${codeLines}`,
      );
    }
    if (!repoInfo.pId) {
      logger.warn(
        `${repoInfo.owner}/${repoInfo.repoName} missing pId, cannot update database`,
      );
    }
  }
}
