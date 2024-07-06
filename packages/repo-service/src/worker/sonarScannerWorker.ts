import { parentPort } from 'worker_threads';
import type { SonarScanParam } from '../interfaces/param';
import shelljs from 'shelljs';
import { Result } from '../utils/result.js';
import { logger } from '@orginjs/oss-evaluation-data-model';
import { getLanguageServiceImpl } from '../services/sonarLanguageService.js';

function runSonarScanner(info: SonarScanParam): Result<SonarScanParam> {
  // get language service
  const languageService = getLanguageServiceImpl(info);
  const commands = languageService.sonarCommands();
  const restoreCommand = languageService.restoreCommand();
  // run commands
  for (const command of commands) {
    logger.info(`start execution of command {${command}}`);
    const shellResult = shelljs.exec(command);
    logger.info(`end execution of command {${command}} , code = ${shellResult.code}`);
    if (shellResult?.code !== 0) {
      // restore changes
      shelljs.exec(restoreCommand);
      logger.error(
        `${info.gitOwner}/${info.repoName} run command {${command}} failed:${shellResult?.stderr}`,
      );
      throw new Error(`sonar scanner failed ${JSON.stringify(info)}`);
    }
  }
  // restore changes
  shelljs.exec(restoreCommand);
  return Result.ok(info);
}

parentPort.on('message', info => {
  try {
    const sonarScanResult = runSonarScanner(info);
    parentPort.postMessage(sonarScanResult);
  } catch (e) {
    parentPort.postMessage(Result.fail(e.message));
  }
});
