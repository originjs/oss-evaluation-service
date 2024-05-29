import type { SonarScanParam } from '../../interfaces/Param';
import type { LanguageSonarScannerInterface } from '../../interfaces/language';
import process from 'node:process';
import fs from 'node:fs';

enum JavaBuildType {
  MAVEN,
  GRADLE,
  GRADLE_KTS,
}

export class JavaLanguageService implements LanguageSonarScannerInterface {
  param: SonarScanParam;
  /**
   * location of the build config file
   */
  buildConfigFile: string;

  buildType: JavaBuildType;

  constructor(param: SonarScanParam) {
    this.param = param;
    this.configBuildType(param);
  }

  restoreCommand(): string {
    const dir = `${process.env.REPO_DIR}/${this.param.gitOwner}/${this.param.repoName}`;
    return `cd ${dir} && git restore .`;
  }

  /**
   * get sonar command
   */
  sonarCommands(): string[] {
    const owner = this.param.gitOwner;
    const repoName = this.param.repoName;
    const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
    switch (this.buildType) {
      case JavaBuildType.MAVEN: {
        const compileCommand = `
            cd ${dir} &&\
            mvn -T 1C\
            clean\
            compile\
            package\
            install\
            -DskipTests\
            -Dmaven.compiler.failOnWarning=false`;
        const sonarCommand = `
            cd ${dir} &&\
            mvn org.sonarsource.scanner.maven:sonar-maven-plugin:LATEST:sonar\
            -Dsonar.host.url=${this.param.sonarHostUrl}\
            -Dsonar.organization=${this.param.sonarOrg}\
            -Dsonar.projectKey=${this.param.sonarKey}\
            -Dsonar.token=${process.env.SONAR_TOKEN}`;
        return [compileCommand, sonarCommand];
      }
      case JavaBuildType.GRADLE:
      case JavaBuildType.GRADLE_KTS: {
        this.addPlugin4Gradle(
          `${
            this.buildType === JavaBuildType.GRADLE ? 'id "org.sonarqube"' : 'id("org.sonarqube")'
          } version '${process.env.SONAR_PLUGIN_GRADLE_VERSION}'`,
        );
        const writeLockCommand = `cd ${dir} && ./gradlew dependencies --write-locks  --parallel`;
        const buildCommand = `cd ${dir} && ./gradlew --parallel build  --parallel -x test`;
        const sonarCommand = `
             cd ${dir} &&\
              ./gradlew\
              sonar\
             -Dsonar.host.url=${this.param.sonarHostUrl}\
             -Dsonar.organization=${this.param.sonarOrg}\
             -Dsonar.projectKey=${this.param.sonarKey}\
             -Dsonar.token=${process.env.SONAR_TOKEN} `;
        return [writeLockCommand, buildCommand, sonarCommand];
      }
      default:
        throw new Error(`unknown build type of project:${owner}/${repoName}`);
    }
  }

  /**
   * restore gradle file after run command
   */

  isMavenProject(dir: string): boolean {
    const mavenConfigFile = `${dir}/pom.xml`;
    return fs.existsSync(mavenConfigFile);
  }

  isGradleProject(dir: string): boolean {
    const gradleConfigFile = `${dir}/build.gradle`;
    return fs.existsSync(gradleConfigFile);
  }

  isGradleKtsProject(dir: string): boolean {
    const gradleKtsConfigFile = `${dir}/build.gradle.kts`;
    return fs.existsSync(gradleKtsConfigFile);
  }

  addPlugin4Gradle(pluginContent: string): void {
    const fileContent = fs.readFileSync(this.buildConfigFile, 'utf8');
    if (fileContent.match(/plugins\s*\{.*org.sonarqube.*}/gms)) {
      //   has sonar scanner plugin
      return;
    }
    const pluginRegex = /plugins\s*\{[^}]*}/gms;
    const match = pluginRegex.exec(fileContent);
    if (match) {
      // add sonar plugin if it matches
      const modifiedPluginsBlock = match[0].slice(0, -1) + `    ${pluginContent}\n}`;
      const afterAddPlugin = fileContent.replace(pluginRegex, modifiedPluginsBlock);
      fs.writeFileSync(this.buildConfigFile, afterAddPlugin, 'utf-8');
    } else {
      throw new Error(`this is no plugins in file:${this.buildConfigFile}`);
    }
  }

  configBuildType(param: SonarScanParam): void {
    const dir = `${process.env.REPO_DIR}/${param.gitOwner}/${param.repoName}`;
    if (this.isMavenProject(dir)) {
      this.buildType = JavaBuildType.MAVEN;
      this.buildConfigFile = `${dir}/pom.xml`;
    } else if (this.isGradleProject(dir)) {
      this.buildType = JavaBuildType.GRADLE;
      this.buildConfigFile = `${dir}/build.gradle`;
    } else if (this.isGradleKtsProject(dir)) {
      this.buildType = JavaBuildType.GRADLE_KTS;
      this.buildConfigFile = `${dir}/build.gradle.kts`;
    } else {
      throw new Error(`unknown java project:{${param.gitOwner}/${param.repoName}} build type`);
    }
  }
}
