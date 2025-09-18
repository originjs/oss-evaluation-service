import { parentPort } from 'worker_threads';
import type { SonarScanParam } from '../interfaces/param';
import shelljs from 'shelljs';
import { Result } from '../utils/result.js';
import { logger } from '@orginjs/oss-evaluation-data-model';
import { getLanguageServiceImpl } from '../services/sonarLanguageService.js';
import { cloneRepoIfNotExist } from './gitWorker.js';

async function runSonarScannerWithClone(info: SonarScanParam): Promise<Result<SonarScanParam>> {
  const cloneParam = {
    owner: info.owner,
    repoName: info.repoName,
    platformType: info.platformType,
    pullIfExists: false,
    shadowClone: true,
  };

  try {
    // 1. 先clone代码
    logger.info(`${info.owner}/${info.repoName}: Starting git clone for sonar scan`);
    const cloneResult = await cloneRepoIfNotExist(cloneParam);
    if (!cloneResult.ok) {
      throw new Error(`Git clone failed: ${cloneResult.msg}`);
    }

    // 2. 执行sonar扫描
    logger.info(`${info.owner}/${info.repoName}: Starting sonar scan`);
    const scanResult = runSonarScanner(info);

    return scanResult;
  } catch (error) {
    logger.error(`${info.owner}/${info.repoName}: Sonar operation failed:`, error);

    // 确保在失败时也要清理
    const languageService = getLanguageServiceImpl(info);
    const afterScanCommand = languageService.afterScanCommand();
    if (afterScanCommand) {
      shelljs.exec(afterScanCommand);
    }

    throw error;
  }
}

function runSonarScanner(info: SonarScanParam): Result<SonarScanParam> {
  // get language service
  const languageService = getLanguageServiceImpl(info);
  const scanCommands = languageService.sonarCommands();
  const afterScanCommand = languageService.afterScanCommand();

  try {
    // run scan commands
    for (const command of scanCommands) {
      logger.info(`start execution of command {${command}}`);
      const shellResult = shelljs.exec(command);
      logger.info(`end execution of command {${command}} , code = ${shellResult.code}`);
      if (shellResult?.code !== 0) {
        logger.error(
          `${info.owner}/${info.repoName} run command {${command}} failed:${shellResult?.stderr}`,
        );
        throw new Error(`sonar scanner failed ${JSON.stringify(info)}`);
      }
    }

    return Result.ok(info);
  } finally {
    // 无论成功失败，都要执行清理
    if (afterScanCommand) {
      logger.info(`${info.owner}/${info.repoName}: Executing cleanup command: ${afterScanCommand}`);
      shelljs.exec(afterScanCommand);
    }
  }
}


parentPort.on('message', async info => {
  try {
    const sonarScanResult = await runSonarScannerWithClone(info);
    parentPort.postMessage(sonarScanResult);
  } catch (e) {
    parentPort.postMessage(Result.fail(e.message));
  }
});
