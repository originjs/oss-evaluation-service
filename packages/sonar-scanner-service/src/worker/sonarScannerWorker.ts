import { parentPort } from 'worker_threads';
import type { SonarScanParam } from '../interfaces/Param';
import shelljs from 'shelljs';
import { Result } from '../utils/result.js';
import { logger } from '@orginjs/oss-evaluation-data-model';
import type { LanguageSonarScannerInterface } from '../interfaces/language';
import { OthersLanguageService } from '../services/sonar-scanner-service/othersLanguage.js';
import { JavaLanguageService } from '../services/sonar-scanner-service/javaLanguage.js';

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

function getLanguageServiceImpl(param: SonarScanParam): LanguageSonarScannerInterface {
  const language = param.language.toUpperCase();
  switch (language) {
    case 'JAVA':
      return new JavaLanguageService(param);
    case 'C++':
    case 'C':
    case 'OBJECT-C':
    case 'C#':
    case 'Rust':
      throw new Error(
        `unsupported sonar scanner of language:{${language}},project:${param.gitOwner}/${param.repoName} `,
      );
    default:
      return new OthersLanguageService(param);
  }
}
