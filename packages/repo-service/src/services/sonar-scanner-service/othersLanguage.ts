import type { SonarScanParam } from '../../interfaces/param';
import type { LanguageSonarScannerInterface } from '../../interfaces/language';
import process from 'node:process';

export class OthersLanguageService implements LanguageSonarScannerInterface {
  constructor(param: SonarScanParam) {
    this.param = param;
  }

  param: SonarScanParam;
  sonarCommands(): string[] {
    const owner = this.param.owner;
    const repoName = this.param.repoName;
    const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
    const sonarCommand = 'sonar-scanner';
    // run sonar
    const scanCommand = `
      cd ${dir} &&\
      ${sonarCommand}\
      -Dsonar.exclusions='**/*.java,**/doc/**/*,**/docs/**/*,**/*test*/**/*,**/*example*/**/*'\
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

  afterScanCommand(): string {
    // delete the downloaded project file
    const dir = `${process.env.REPO_DIR}/${this.param.owner}/${this.param.repoName}`;
    return `rm -rf ${dir}`;
  }
}
