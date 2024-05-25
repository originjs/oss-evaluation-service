import { parentPort } from 'worker_threads';
import type { SonarScanParam } from '../interfaces/RepoInfo';
import process from 'node:process';
import shelljs from 'shelljs';
import { Result } from '../utils/result.js';
import { logger } from '@orginjs/oss-evaluation-data-model';

function runSonarScanner(info: SonarScanParam): Result<SonarScanParam> {
  const owner = info.gitOwner;
  const repoName = info.repoName;
  const language = info.language.toUpperCase();
  const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
  logger.info(`start to scan ${owner}/${repoName}`);
  // run sonar
  let scanCommand = `sonar-scanner\
     -Dsonar.organization=${info.sonarOrg}\
     -Dsonar.projectKey=${info.sonarKey}\
     -Dsonar.sources=.\
     -Dsonar.host.url=${info.sonarHostUrl}\
     -Dsonar.projectBaseDir=${dir}\
     -Dproject.home=${dir}`;
  if (language !== 'JAVA') {
    scanCommand += ' -Dsonar.exclusions=**/*.java';
  }
  if (language !== 'C' && language !== 'C++') {
    scanCommand += ` -Dsonar.c.file.suffixes=-\
    -Dsonar.cpp.file.suffixes=-\
    -Dsonar.objc.file.suffixes=-`;
  }
  const shellResult = shelljs.exec(scanCommand);
  if (shellResult?.code === 0) {
    // try to collect sonar data
    return Result.ok(info);
  } else {
    logger.error(shellResult?.stderr);
    throw new Error(`sonar scanner failed ${JSON.stringify(info)}`);
  }
}

parentPort.on('message', info => {
  try {
    const sonarScanResult = runSonarScanner(info);
    parentPort.postMessage(sonarScanResult);
  } catch (e) {
    parentPort.postMessage(Result.fail(e.messagge));
  }
});
