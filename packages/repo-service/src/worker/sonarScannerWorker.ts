import { parentPort } from 'worker_threads';
import type { SonarScanParam } from '../interfaces/param';
import shelljs from 'shelljs';
import { Result } from '../utils/result.js';
import { logger } from '@orginjs/oss-evaluation-data-model';
import { getLanguageServiceImpl } from '../services/sonarLanguageService.js';

function runSonarScanner(info: SonarScanParam): Result<SonarScanParam> {
  // get language service
  const languageService = getLanguageServiceImpl(info);
  const scanCommands = languageService.sonarCommands();
  const afterScanCommand = languageService.afterScanCommand();
  // run scan commands
  for (const command of scanCommands) {
    logger.info(`start execution of command {${command}}`);
    const shellResult = shelljs.exec(command);
    logger.info(`end execution of command {${command}} , code = ${shellResult.code}`);
    if (shellResult?.code !== 0) {
      logger.error(
        `${info.owner}/${info.repoName} run command {${command}} failed:${shellResult?.stderr}`,
      );
      if (afterScanCommand) {
        // run after scan command
        shelljs.exec(afterScanCommand);
      }
      throw new Error(`sonar scanner failed ${JSON.stringify(info)}`);
    }
  }
  if (afterScanCommand) {
    // run after scan command
    shelljs.exec(afterScanCommand);
  }
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
