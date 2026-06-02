## proxy github

### v2ray2(proxy)
please visit https://v2raya.org/docs/prologue/introduction/


## docker
### command
``` bash
 docker run -d  \
   -v /home/xxxxx/cache/maven:/root/.m2 \
   -v /home/xxxxx/cache/gradle:/root/.gradle \
   -v /home/xxxxx/git-projects:/root/projects \
   -v /home/xxxxx/projects/oss-evaluation-service/packages/repo-service:/repo-service \
   -p 3000:3000 \
   -p 2017:2017 \
   repo-service:v0.0.1
```


### data volume
| dir           | description|
| -------------- | ----------- |
| /root/.m2      | maven cache|
| /root/.gradle  | gradle cache|
| /root/projects | local git repo|
| /repo-service  | the dir where the pnpm command is executed|

#### port
| port  | description |
| -------------- | ----------- |
| 3000      | repo-service http port|
| 2017 | v2ray service http port  |
