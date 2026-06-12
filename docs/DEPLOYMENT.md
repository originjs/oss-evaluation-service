# 部署指南

服务职责说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)。本文只讲怎么把它跑起来。

## 前置条件

- Docker + Docker Compose v2(`docker compose` 命令),或 Podman + podman-compose
- 一个可访问的 MySQL 8+(或使用下面的 local-mysql profile)

### 使用 Podman

所有 `docker compose ...` 命令可等价替换为 `podman compose ...`:

```bash
brew install podman podman-compose
podman machine init   # 首次;建议 --memory 4096 以上,pnpm install 较吃内存
podman machine start
podman compose --profile local-mysql up --build -d
```

注意:确认宿主机 3000/3001/3306/8080 端口没有被本地 dev 进程(nodemon 等)占用,否则容器端口映射会失败。

## 一、最快路径:本机一键启动(含测试 MySQL)

适合拿到代码后第一次验证,不需要任何外部依赖。

```bash
git clone <repo>
cd oss-evaluation-service

# 1. 准备环境变量
cp .env.example .env

# 2. .env 里把 DATABASE_URL 改成指向 compose 内置 MySQL:
#    DATABASE_URL=mysql://root:oss-eval-root@mysql:3306/oss-eval

# 3. 启动(local-mysql profile 会启动 MySQL 并自动导入 sql/init.sql)
docker compose --profile local-mysql up --build -d

# 4. 等 MySQL 健康后验证
curl http://localhost:3001/            # integration  -> {"ok":"200"}
curl http://localhost:3000/api-docs/   # api-server Swagger UI
open http://localhost:8080             # 前端
```

注意:`mysql` 这个主机名只在 compose 网络内有效,所以 `.env` 里 `DATABASE_URL` 的 host 写 `mysql` 即可。

## 二、生产路径:外部 MySQL

生产环境 MySQL 在独立机器上,compose 默认**不**启动 MySQL。

### 1. 初始化数据库(只做一次)

```bash
mysql -h <mysql-host> -u <user> -p <database> < sql/init.sql
```

### 2. 配置 `.env`

```bash
cp .env.example .env
```

最少要改:

```env
DATABASE_URL=mysql://oss_eval_user:password@mysql-host.example.com:3306/oss-eval
```

其余变量按需:

| 变量 | 说明 |
|---|---|
| `NODE_ENV` | `production` 才会启用 integration 的定时任务 |
| `DISABLE_SCHEDULE_JOB` | 非空即禁用定时任务;生产要跑任务时设为空 |
| `GITHUB_TOKEN` 等 | JSON 数组字符串,如 `["ghp_xxx"]`;没有就 `[]` |
| `INTEGRATION_URL` | api-server 调 integration 的地址,compose 内默认 `http://integration:3001` |
| `REPO_SERVICE_URL` | integration 调 repo-service 的地址;启用 repo-service profile 时设为 `http://repo-service:3002` |
| `WEBSITE_PORT` / `API_SERVER_PORT` / `INTEGRATION_PORT` | 宿主机端口映射 |

### 3. 启动

```bash
# 默认三件套:website + api-server + integration
docker compose up --build -d

# 需要 repo-service 时:
docker compose --profile repo-service up --build -d
```

### 4. 验证

```bash
curl http://localhost:3000/api-docs/    # api-server
curl http://localhost:3001/             # integration -> {"ok":"200"}
curl http://localhost:8080/             # website 首页 HTML
curl http://localhost:3002/api-docs/    # repo-service(如启用)
```

## 三、只部署单个服务

每个服务的 Dockerfile 都以**仓库根目录**为构建上下文:

```bash
docker build -f packages/integration/Dockerfile  -t oss-eval-integration .
docker build -f packages/api-server/Dockerfile   -t oss-eval-api-server  .
docker build -f packages/website/Dockerfile      -t oss-eval-website     .
docker build -f packages/repo-service/Dockerfile -t oss-eval-repo-service .
```

运行时所需环境变量见各服务目录下的 `.env.example`。例:

```bash
docker run -d -p 3000:3000 \
  -e DATABASE_URL='mysql://user:pass@host:3306/oss-eval' \
  oss-eval-api-server
```

website 特殊点:

- 后端地址是**构建期** ARG(`VITE_BACKEND_SERVICE_URL`,默认 `/oss-evaluation-api` 走 nginx 代理),要直连其他地址需 `--build-arg` 重新构建。
- 内置 nginx 把 `/oss-evaluation-api/**` 代理到 `http://api-server:3000`(compose 服务名)。脱离 compose 部署时需要自行修改 `packages/website/nginx.conf` 或在外层网关做同样代理。

## 四、不用 Docker 的本地开发

```bash
pnpm install            # 需要 pnpm 9+,Node 20+
cp .env.example .env    # 配好 DATABASE_URL

pnpm dev                # api-server (:3000) + website (vite dev)
pnpm dev-integ          # 按需:integration (:3001)
pnpm dev-repo-server    # 按需:repo-service (:3002),本机需安装 git + cloc
```

## 启动后验证清单

一键启动后,跑下面命令确认每个服务真正可用(不只是端口开着):

```bash
# 1. 容器全部 Up,mysql 显示 healthy
podman ps   # 或 docker ps

# 2. website:返回真实前端 HTML(含 <title>OSS Evaluation ...)
curl -s http://localhost:8080/ | grep '<title>'

# 3. website -> api-server -> MySQL 全链路(应返回 {"code":200,...})
curl -s 'http://localhost:8080/oss-evaluation-api/trend/languageFilter'

# 4. api-server 直连 + Swagger
curl -s 'http://localhost:3000/trend/languageFilter'
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api-docs/   # 200

# 5. integration 健康 + Swagger
curl -s http://localhost:3001/          # {"ok":"200"}
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/api-docs/   # 200

# 6. repo-service(如启用 profile)
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3002/api-docs/   # 200

# 7. 数据库 schema 已导入(应为 43,与 init.sql 的 CREATE TABLE 数一致)
podman exec oss-eval-mysql mysql -uroot -poss-eval-root -N \
  -e "select count(*) from information_schema.tables where table_schema='oss-eval' and table_type='BASE TABLE'"
```

空库属正常状态:查询类接口返回 `{"code":200,"data":null}` 或空数组;要有真实数据需调用 integration 的 `/sync/**` 接口抓取,见下一节。

## 灌入真实数据:用 integration 爬取一个项目

空库验证通过后,可以爬一个真实项目做端到端测试(以 vuejs/core 为例):

```bash
curl -X POST http://localhost:3001/sync/syncSingleProjectAllMetadata \
  -H 'Content-Type: application/json' \
  -d '{
    "repoUrl": "https://github.com/vuejs/core",
    "category": "front_end",
    "subcategory": "framework",
    "packageName": "vue"
  }'
# 约 1-2 分钟后返回: Project Integration Successful!: https://github.com/vuejs/core
```

然后在 api-server 验证数据可见:

```bash
curl 'http://localhost:3000/project/vuejs%2Fcore'
# 返回 {"code":200,"data":{"fullName":"vuejs/core","stargazersCount":...}}

curl 'http://localhost:8080/oss-evaluation-api/project/vuejs%2Fcore'   # 前端代理同样可见
```

说明:

- **不配 token 也能跑通主链路**:项目元数据、star 数、CNCF 文档分等公开 API 部分会成功写库;但 contributors、dependent count、依赖图(GraphQL)、AI 相关字段会失败跳过(日志里有 `GitHub token validation: 0/0 usable` 等 ERROR,设计如此,不会中断整体流程)。
- **要完整数据**:`.env` 配 `GITHUB_TOKEN=["ghp_xxx"]` 后 `docker compose up -d integration` 重建容器。
- 该接口是同步逐项执行,一个项目约 1-2 分钟,勿对大量项目串行调用;批量用 `/sync/syncBatchProjectAllMetadataByRepoUrls`。

## .env 是怎么生效的(必读)

很多"部署不上"的困惑来自不清楚 env 的传递链,这里讲清楚:

1. **只有根目录 `.env` 会被 docker compose 读取**。`docker compose up` 时,compose 用它替换 `docker-compose.yml` 里的 `${VAR}` 占位符,再把结果作为**容器环境变量**注入。
2. **镜像里不打包任何 `.env`**(`.dockerignore` 排除了 `**/.env*`)。容器内的 Node 进程直接读 `process.env`,来源就是第 1 步注入的值。
3. **`packages/*/.env.example` 不参与 compose**,它们只用于两种场景:本地裸跑(`pnpm dev` 时各服务用 dotenv 读自己目录的 `.env`)、或脱离 compose 单容器部署时作为 `docker run -e` 的参数清单。
4. **改了 `.env` 之后**:`docker compose up -d` 重建容器即可生效(环境变量在容器创建时固定);**不需要**重新 build 镜像。唯一例外是 `VITE_BACKEND_SERVICE_URL`,它是前端构建期参数,改了必须 `docker compose build website`。
5. **变量优先级**:shell 里 export 的同名变量 > `.env` 文件。如果你 shell 里残留了旧的 `DATABASE_URL`,会覆盖 `.env`,这是常见坑。

一句话:**部署只维护根目录一个 `.env`,改完 `up -d` 重建即可;只有前端 API 地址要重新 build。**

`packages/landscape` 不在 compose 里:它是离线静态站点生成工具,不是常驻服务,见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 常见部署失败原因

1. **没有初始化数据库** — 服务能启动但接口报表不存在。先执行 `sql/init.sql`。
2. **`DATABASE_URL` 没配** — compose 直接报错退出(故意的,`:?` 强校验)。
3. **token 格式不对** — `GITHUB_TOKEN=ghp_xxx` 会让 `JSON.parse` 抛错,必须写 `["ghp_xxx"]`。
4. **前端 404/跨域** — 前端 API 地址是构建期写死的;改 `VITE_BACKEND_SERVICE_URL` 后必须 `docker compose build website`。
5. **repo-service 不工作** — 检查镜像内是否有 `git`/`cloc`(本仓库 Dockerfile 已装),以及 integration 是否配置了 `REPO_SERVICE_URL`。
