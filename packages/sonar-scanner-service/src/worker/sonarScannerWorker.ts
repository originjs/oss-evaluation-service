import { parentPort } from 'worker_threads';
import type { SonarScanParam } from '../interfaces/RepoInfo';
import process from 'node:process';
import shelljs from 'shelljs';

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

export interface SonarScanResult {
  ok: boolean;
  sonarKey: string;
  msg: string;
}

function runSonarScanner(info: SonarScanParam): SonarScanResult {
  const owner = info.gitOwner;
  const repoName = info.repoName;
  const language = info.language.toUpperCase();
  const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
  console.log(`start to scan ${owner}/${repoName}`);
  // run sonar
  let scanCommand = `sonar-scanner\
     -Dsonar.organization=${info.sonarOrg}\
     -Dsonar.projectKey=${info.sonarKey}\
     -Dsonar.sources=.\
     -Dsonar.host.url=${info.sonarHostUrl}\
     -Dsonar.projectBaseDir=${dir}`;
  if (language !== 'JAVA') {
    scanCommand += ' -Dsonar.exclusions=**/*.java';
  }
  if (language !== 'C' && language !== 'C++') {
    scanCommand += ` -Dsonar.c.file.suffixes=-\
    -Dsonar.cpp.file.suffixes=-\
    -Dsonar.objc.file.suffixes=-`;
  }
  const shellResult = shelljs.exec(
    // eslint-disable-next-line max-len
    scanCommand,
  );
  if (shellResult.code === 0) {
    // try to collect sonar data
    sleep(5000).then(() => {
      console.log(`try to collect sonar ${JSON.stringify([info.sonarKey])}`);
      fetch(`${process.env.INTEGRATION_HOST}/sync/sonarCloud/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([info.sonarKey]),
      })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    });
    return { ok: true, sonarKey: info.sonarKey, msg: null };
  } else {
    return { ok: false, sonarKey: info.sonarKey, msg: shellResult.stderr };
  }
}

parentPort.on('message', info => {
  const sonarScanResult = runSonarScanner(info);
  parentPort.postMessage(sonarScanResult);
});
