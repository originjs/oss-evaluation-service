import type { SonarScanParam } from '../../interfaces/Param';
import type { LanguageSonarScannerInterface } from '../../interfaces/language';
import process from 'node:process';
import fs from 'node:fs';

enum JavaBuildType {
  MAVEN,
  GRADLE,
  GRADLE_KTS,
}

const initGradleFileName = '.sonar-scanner-gradle-init.gradle';

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
    if (this.buildType === JavaBuildType.GRADLE || this.buildType === JavaBuildType.GRADLE_KTS) {
      return `rm ${dir}/${initGradleFileName}`;
    } else {
      return `echo no need to clean`;
    }
  }

  /**
   * get sonar command
   */
  sonarCommands(): string[] {
    const owner = this.param.gitOwner;
    const repoName = this.param.repoName;
    const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
    let mvnCommand = 'mvn';
    // if exists './mvnw' wrapper, using wrapper instead of mvn
    if (fs.existsSync(`${dir}/mvnw`)) {
      mvnCommand = './mvnw';
    }
    switch (this.buildType) {
      case JavaBuildType.MAVEN: {
        const installCommand = `
            cd ${dir} &&\
            ${mvnCommand} -T 1C \
            clean\
            package\
            -DskipTests\
            -Denforcer.skip=true\
            -Drat.skip=true\
            -Dmaven.javadoc.skip=true\
            -Dcheckstyle.skip=true\
            -Dpmd.skip=true\
            -Dfindbugs.skip=true\
            -Dcobertura.skip=true\
            -Dspotbugs.skip=true\
            -Dxjc.skip=true\
            -Danimal.sniffer.skip=true\
            -Dlicense.skip=true\
            -Dgpg.skip=true\
            -Djavafx.platform=linux\
            -Dmaven.compiler.failOnWarning=false`;
        const sonarCommand = `
            cd ${dir} &&\
            ${mvnCommand} org.sonarsource.scanner.maven:sonar-maven-plugin:LATEST:sonar\
            -Dsonar.host.url=${this.param.sonarHostUrl}\
            -Dsonar.organization=${this.param.sonarOrg}\
            -Dsonar.projectKey=${this.param.sonarKey}\
            -Dsonar.token=${process.env.SONAR_TOKEN}`;
        return [installCommand, sonarCommand];
      }
      case JavaBuildType.GRADLE:
      case JavaBuildType.GRADLE_KTS: {
        const initContent = `
        initscript {
            repositories {
                gradlePluginPortal()
            }
            dependencies {
                classpath("org.sonarqube:org.sonarqube.gradle.plugin:5.0.0.4638")
            }
        }
        allprojects {
            apply plugin: org.sonarqube.gradle.SonarQubePlugin
            tasks.withType(Tar).configureEach {
              duplicatesStrategy = DuplicatesStrategy.EXCLUDE
            }
            tasks.withType(Copy).configureEach {
              duplicatesStrategy = DuplicatesStrategy.EXCLUDE
            }
             tasks.withType(Zip).configureEach {
              duplicatesStrategy = DuplicatesStrategy.EXCLUDE
            }
            tasks.matching { it.name.toLowerCase().contains("style") }.configureEach {
              enabled = false
            }
            tasks.matching { it.name.toLowerCase().contains("doc") }.configureEach {
              enabled = false
            }
            tasks.matching { it.name.toLowerCase().contains("dist") }.configureEach {
              enabled = false
            }
        } 
        `;
        const initFilePath = `${dir}/${initGradleFileName}`;
        fs.writeFileSync(initFilePath, initContent, 'utf-8');
        const sonarCommand = `
             cd ${dir} &&\
              ./gradlew --parallel\
              clean\
              build\
              sonar\
              -x test\
              -x check\
              --init-script ${initFilePath} \
              -Dorg.gradle.daemon=false\
              -Dsonar.host.url=${this.param.sonarHostUrl}\
              -Dsonar.organization=${this.param.sonarOrg}\
              -Dsonar.projectKey=${this.param.sonarKey}\
              -Dsonar.token=${process.env.SONAR_TOKEN} `;
        return [sonarCommand];
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
