import type { SonarScanParam } from '../../interfaces/Param';
import type { LanguageSonarScannerInterface } from '../../interfaces/language';
import process from 'node:process';

export class OthersLanguageService implements LanguageSonarScannerInterface {
  constructor(param: SonarScanParam) {
    this.param = param;
  }

  param: SonarScanParam;

  sonarCommands(): string[] {
    const owner = this.param.gitOwner;
    const repoName = this.param.repoName;
    const language = this.param.language.toUpperCase();
    const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
    // run sonar
    let scanCommand = `
      cd ${dir} &&\
      sonar-scanner\
     -Dsonar.organization=${this.param.sonarOrg}\
     -Dsonar.projectKey=${this.param.sonarKey}\
     -Dsonar.sources=.\
     -Dsonar.host.url=${this.param.sonarHostUrl}
     -Dsonar.token=${process.env.SONAR_TOKEN}`;
    if (language !== 'JAVA') {
      scanCommand += ' -Dsonar.exclusions=**/*.java';
    }
    if (language !== 'C' && language !== 'C++') {
      scanCommand += ` -Dsonar.c.file.suffixes=-\
    -Dsonar.cpp.file.suffixes=-\
    -Dsonar.objc.file.suffixes=-`;
    }
    return [scanCommand];
  }
  restoreCommand(): string {
    return `echo 'no need to restore'`;
  }
}
