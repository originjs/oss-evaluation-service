import type { SonarScanParam } from '../../interfaces/param';
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
    const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
    const sonarCommand = 'sonar-scanner';
    // run sonar
    const scanCommand = `
      cd ${dir} &&\
      ${sonarCommand}\
      -Dsonar.exclusions='**/*.java'\
      -Dsonar.c.file.suffixes=-\
      -Dsonar.cpp.file.suffixes=-\
      -Dsonar.objc.file.suffixes=-\
      -Dsonar.organization=${this.param.sonarOrg}\
      -Dsonar.projectKey=${this.param.sonarKey}\
      -Dsonar.sources=.\
      -Dsonar.host.url=${this.param.sonarHostUrl}\
      -Dsonar.token=${this.param.sonarToken}`;
    return [scanCommand];
  }
  restoreCommand(): string {
    return `echo 'no need to restore'`;
  }
}
