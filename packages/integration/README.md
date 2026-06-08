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

### 2. 配置 integration 环境变量

单独部署 integration 时，只看这个文件：

```bash
packages/integration/.env.example
```

复制一份：

```bash
cp packages/integration/.env.example packages/integration/.env
```

然后编辑 `packages/integration/.env`，至少改 `DATABASE_URL`：

```env
DATABASE_URL=mysql://oss_eval_user:password@mysql-host.example.com:3306/oss-eval
PORT=3001
NODE_ENV=development
DISABLE_SCHEDULE_JOB=true
GITHUB_TOKEN=[]
GITEE_TOKEN=[]
GITCODE_TOKEN=[]
```

说明：

- `PORT=3001` 是 integration 容器内部监听端口
- 不要管 `INTEGRATION_PORT`；那只给根目录 docker compose 用
- 生产可以不用 `.env` 文件，直接把这些变量设置到容器环境变量里
- token 必须是 JSON 数组字符串；没有 token 就写 `[]`

正式跑定时任务时这样配：

```env
NODE_ENV=production
DISABLE_SCHEDULE_JOB=
```

### 3. 构建 integration 镜像

从仓库根目录执行：

```bash
podman build -f packages/integration/Dockerfile -t oss-evaluation-integration .
```

注意最后的 `.` 不能省，它表示构建上下文是仓库根目录。

### 4. 启动 integration 容器

```bash
podman run -d --replace \
  --name oss-eval-integration \
  --env-file packages/integration/.env \
  -p 3001:3001 \
  oss-evaluation-integration
```

这条命令里：

- `--env-file packages/integration/.env`：把 integration 的环境变量注入容器
- `-p 3001:3001`：宿主机 `3001` 端口映射到容器 `3001` 端口
- 镜像不会 COPY `.env`，`.env` 只是运行容器时注入变量

### docker compose（可选）

如果你明确要用根目录 `docker-compose.yml`，才看根目录 `.env.example`：

```bash
cp .env.example .env
docker compose up --build -d integration
```

否则部署 integration 不需要管根目录 `.env.example` 里的 `INTEGRATION_PORT`。

## 文档地址

启动后可访问：

- `http://localhost:3001/api-docs`
