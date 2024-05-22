import { parentPort } from 'worker_threads';
import type { SonarScanParam } from '../interfaces/RepoInfo';
import process from 'node:process';
import shelljs from 'shelljs';

function runSonarScanner(info: SonarScanParam) {
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
  if (language !== 'C' && language.toUpperCase() !== 'C++') {
    scanCommand += ` -Dsonar.c.file.suffixes=-\
    -Dsonar.cpp.file.suffixes=-\
    -Dsonar.objc.file.suffixes=-`;
  }
  shelljs.exec(
    // eslint-disable-next-line max-len
    scanCommand,
  );
  //   try to trigger collect sonar cloud data
  fetch(`${process.env.INTWGRATION_HOST}/sonarCloud/collect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([info.sonarKey]),
  })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

parentPort.on('message', info => {
  runSonarScanner(info);
  parentPort.postMessage(info.sonarKey);
});
