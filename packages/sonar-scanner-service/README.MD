## requirement
1. JDK >= 17
```shell
   sudo apt update
   sudo apt install openjdk-17-jdk
```
2. Node LTS 20
3. sonar-scanner ( https://docs.sonarsource.com/sonarcloud/advanced-setup/ci-based-analysis/sonarscanner-cli/)
4. Maven >= 3.2.5 ( for maven project)
```shell
  sudo apt update
  sudo apt install maven
```
env
5. Gradle
  no need to install gradle,it is necessary to set the dependency directory used by Gradle to be consistent with Maven in order to prevent duplicate downloads of the same dependencies.
  `export GRADLE_USER_HOME=/home/xxxxxx/.m2/repository`
## .env file
// store github projects
REPO_DIR=/xxxxx/github_projects
// integration url
INTEGRATION_HOST=http://127.0.0.1:3001
// database
DATABASE_URL='xxxx'

## set env(.bash_rc) of linux
```shell
vim ~/.bashrc
export PATH=$PATH:/xxxxxx/sonar-scanner-5.0.1/bin
export SONAR_TOKEN=6d7f25b2ed81caf82a6b74080f61089ac7b973ac
export SONAR_SCANNER_OPTS="-Xmx2048m -Xms512m -–add-opens java.base/sun.nio.ch=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED"
source ~/.bashrc
```

## proxy github
### github520(dns)
try to use github520 replace dns
``` bash 
sudo sh -c 'sed -i "/# GitHub520 Host Start/Q" /etc/hosts && curl https://raw.hellogithub.com/hosts >> /etc/hosts'
```

## v2ray2(proxy)
please visit https://v2raya.org/docs/prologue/introduction/
