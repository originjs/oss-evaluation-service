## requirement(for rocky/alma/redHat... linux system)
1. JDK(use sdkman to install jdks)
2. Maven >= 3.2.5 ( for maven project)
```shell
  sudo apt update
  sudo apt install maven
```
3. Gradle
   no need to install gradle,it is necessary to set the dependency directory used by Gradle to be consistent with Maven in order to prevent duplicate downloads of the same dependencies.
4. Node LTS 20
```shell
   sudo apt update
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install nodejs
   node -v
   # pnpm
   sudo npm install pnpm -g
```
5. sonar-scanner
  please visit  https://docs.sonarsource.com/sonarcloud/advanced-setup/ci-based-analysis/sonarscanner-cli/
``` shell
  sed -i "1i export SONAR_TOKEN=xxxxxxxxx" ~/.bashrc
  sed -i "2i export SONAR_SCANNER_OPTS=\"-Xmx2048m -Xms512m --add-opens java.base/sun.nio.ch=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED\"" ~/.bashrc
  sed -i "3i export PATH=\$PATH:/home/xxxxxxxx/software/sonar-scanner-5.0.1.3006-linux/bin" ~/.bashrc
```

## .env file
```dotenv
DATABASE_URL='xxxxx'
SONAR_CLOUD_TOKEN='b86c03e0c58dfc621e50c76d47758d27ccf0e66c'
SONAR_ORG_NAME='oss-evaluation'
SONAR_SCAN_SERVICE_HOST='http://127.0.0.1:3000'
```

// store github projects
REPO_DIR=/xxxxx/github_projects
// integration url
INTEGRATION_HOST=http://127.0.0.1:3001
// database
DATABASE_URL='xxxx'

## proxy github
### v2ray2(proxy)
please visit https://v2raya.org/docs/prologue/introduction/
```shell
curl -Ls https://mirrors.v2raya.org/go.sh | sudo bash
```
