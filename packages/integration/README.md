# integration

数据集成与定时任务服务。

## 作用

该包负责从外部数据源拉取、计算和回写平台所需数据，并提供一部分同步触发接口。

当前代码中包括：

- 多类同步控制器
- `/sync` 路由入口
- 定时任务调度
- Swagger 文档
- 项目 `codeSize`、依赖数、贡献者、趋势等同步逻辑

## 默认端口

- `3001`

可通过 `PORT` 环境变量覆盖。

## 启动方式

```bash
pnpm -C packages/integration dev
pnpm -C packages/integration start
pnpm -C packages/integration test
```

对应含义：

- `dev`：使用 nodemon 启动开发服务
- `start`：启动集成服务
- `test`：运行 Vitest

容器镜像基于 Node.js 22。

## 调度说明

定时任务入口位于：

- `bin/www.js`
- `scheduler/job.js`
- `scheduler/config.js`

生产环境下会按配置启动定时任务；开发环境默认不启动调度。

## 与 repo-service 的关系

`integration` 在同步项目 `codeSize` 时，优先尝试远程 API。

只有在远程结果不可用，且配置了 `REPO_SERVICE_URL` 时，才会回退调用 `repo-service` 的 `POST /repo/getCodeSize`。

## Docker 部署

生产部署只运行 integration 容器。MySQL 应部署在物理机或独立数据库服务上，通过 `DATABASE_URL` 连接。

### 1. 准备数据库

`integration` 不负责建库建表。目标 MySQL 必须已经有 `sql/init.sql` 对应的 schema。

全新数据库只需要初始化一次：

```bash
mysql -h <mysql-host> -u <user> -p <database> < sql/init.sql
```

### 2. 配置环境变量

环境变量配置在仓库根目录 `.env`，不是 `packages/integration/.env`：

```bash
cp .env.example .env
```

最小生产/部署配置：

```env
DATABASE_URL=mysql://oss_eval_user:password@mysql-host.example.com:3306/oss-eval
INTEGRATION_PORT=3001
NODE_ENV=development
DISABLE_SCHEDULE_JOB=true
GITHUB_TOKEN=[]
GITEE_TOKEN=[]
GITCODE_TOKEN=[]
```

真实同步数据时，把 token 填成 JSON 数组字符串：

```env
GITHUB_TOKEN=["ghp_xxx"]
GITEE_TOKEN=["gitee_xxx"]
GITCODE_TOKEN=["gitcode_xxx"]
```

### 环境变量用途

- `DATABASE_URL`：integration 连接主 MySQL，必填
- `NODE_ENV`：`production` 才会启用 scheduler；`development` 只跑 API
- `DISABLE_SCHEDULE_JOB`：只要非空，就强制禁用 scheduler
- `GITHUB_TOKEN`：JSON 数组字符串，按顺序从主到备；GitHub 代码会验证并使用第一个有效 token
- `GITEE_TOKEN` / `GITCODE_TOKEN`：JSON 数组字符串；保留现有接入方式，按当前代码路径使用
- `DATABASE_EXT_URL`：少数扩展数据库查询路径使用，不配不影响主链路
- `LOG_DIR`：日志目录
- `REPO_SERVICE_URL`：仓库代码体积统计的可选外部服务，不配则跳过这条本地 cloc 路径
- `COZE_API_TOKEN`：只给 Coze AI 路径用；当没配 `EXT_AI_SERVICE_URL` 时，`/sync/alternative` 和 `/sync/aiClassification` 会走 Coze
- `EXT_AI_SERVICE_URL`：如果配置，`/sync/alternative` 和 `/sync/projectDescription` 会向这个外部 AI 服务发请求
- `EXT_ALTERNATIVE_BOT`：发给 `EXT_AI_SERVICE_URL` 的 alternative bot/token
- `EXT_PROJECT_DESCRIPTION_BOT`：发给 `EXT_AI_SERVICE_URL` 的 projectDescription bot/token

注意：

- 当前没有 scheduler 自动触发 AI 路径；AI 请求只会在调用相关 API 时发生
- `projectDescription` 只有外部 AI 路径，没有 Coze fallback

### 3. 启动 integration

从仓库根目录执行：

```bash
docker compose up --build -d integration
```

这不会启动 MySQL，也不会重新初始化数据库。

### 本地测试 MySQL（非生产）

如果没有物理机 MySQL，只是本地冒烟测试，可以临时启动测试 MySQL：

```bash
docker compose --profile local-mysql up -d mysql
```

这个测试 MySQL 才会在 `mysql-data` 数据卷为空时导入 `sql/init.sql`。

本地测试时 `.env` 里的数据库地址可写：

```env
DATABASE_URL=mysql://root:oss-eval-root@mysql:3306/oss-eval
```

说明：

- 构建上下文必须是仓库根目录，因为镜像需要 workspace 根配置和内部依赖包
- `sql/init.sql` 是初始化脚本；生产应在物理机 MySQL 上手动/脚本执行一次
- 默认 `NODE_ENV=development` 且 `DISABLE_SCHEDULE_JOB=true`，定时任务不会跑
- 生产启用定时任务时，设置 `NODE_ENV=production`，并让 `DISABLE_SCHEDULE_JOB` 为空

## 文档地址

启动后可访问：

- `http://localhost:3001/api-docs`
