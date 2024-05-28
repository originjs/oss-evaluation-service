## requirement
1. JDK >= 17(use sdkman install jdks)
2. Node LTS 20
3. sonar-scanner ( https://docs.sonarsource.com/sonarcloud/advanced-setup/ci-based-analysis/sonarscanner-cli/)
4. Maven >= 3.2.5 (use sdkman install)
5. Gradle
  no need to install gradle,it is necessary to set the dependency directory used by Gradle to be consistent with Maven in order to prevent duplicate downloads of the same dependencies.

## set env(.bash_rc) of linux
```shell
vim ~/.bashrc
export PATH=$PATH:/xxxxxx/sonar-scanner-5.0.1/bin
export SONAR_SCANNER_OPTS="-Xmx2048m -Xms512m
source ~/.bashrc
```

## proxy github

### v2ray2(proxy)
please visit https://v2raya.org/docs/prologue/introduction/
