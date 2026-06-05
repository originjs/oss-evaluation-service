# oss-evaluation-service

开源项目评估平台 monorepo。

## Docker 生产部署

### 1. 数据库前置条件

生产环境的 MySQL 部署在物理机或独立数据库服务上，`docker-compose.yml` **不会** 默认启动 MySQL。

`integration` 启动前，目标 MySQL 里必须已经有 `sql/init.sql` 对应的 schema。

如果是全新数据库，由 DBA 或部署脚本在物理机 MySQL 上执行一次：

```bash
mysql -h <mysql-host> -u <user> -p <database> < sql/init.sql
```

`sql/init.sql` 是初始化脚本，不是 integration 容器每次启动都会执行的东西。

### 2. 配置环境变量

推荐使用根目录 `.env`：

```bash
cp .env.example .env
```

然后编辑 `.env`，至少改 `DATABASE_URL`：

```env
DATABASE_URL=mysql://oss_eval_user:password@mysql-host.example.com:3306/oss-eval
INTEGRATION_PORT=3001
NODE_ENV=development
DISABLE_SCHEDULE_JOB=true
GITHUB_TOKEN=[]
GITEE_TOKEN=[]
GITCODE_TOKEN=[]
```

说明：

- `DATABASE_URL` 指向生产/物理机 MySQL
- `GITHUB_TOKEN` / `GITEE_TOKEN` / `GITCODE_TOKEN` 必须是 JSON 数组字符串，因为代码会 `JSON.parse()`
- 开发或冒烟测试保留 `DISABLE_SCHEDULE_JOB=true`
- 生产要跑定时任务时，设置 `NODE_ENV=production`，并把 `DISABLE_SCHEDULE_JOB` 设为空

真实同步外部数据时：

```env
GITHUB_TOKEN=["ghp_xxx"]
GITEE_TOKEN=["gitee_xxx"]
GITCODE_TOKEN=["gitcode_xxx"]
```

### 3. 启动 integration

```bash
docker compose up --build -d integration
```

这只会构建并启动 integration 容器。MySQL 不会被 compose 默认启动。

### 4. 验证

```bash
curl http://localhost:3001/
curl http://localhost:3001/api-docs/
```

预期：

- `/` 返回 `{"ok":"200"}`
- `/api-docs/` 返回 Swagger UI HTML

### 本地测试 MySQL（非生产）

如果只是本机测试，没有物理机 MySQL，可以临时启动测试 MySQL：

```bash
docker compose --profile local-mysql up -d mysql
```

这个测试 MySQL 才会在数据卷为空时导入 `sql/init.sql`。它不是生产部署路径。

本地测试时 `.env` 里的数据库地址可写：

```env
DATABASE_URL=mysql://root:oss-eval-root@mysql:3306/oss-eval
```

### 启动默认开发链路

```bash
pnpm install
pnpm dev
```

`pnpm dev` 默认只启动：

- `api-server`：`http://localhost:3000`
- `website`

默认 **不会** 启动：

- `integration`
- `repo-service`

### 按需启动其他服务

```bash
pnpm dev-integ
pnpm dev-repo-server
```

## 服务入口

- API Server Swagger：`http://localhost:3000/api-docs`
- Integration Swagger：`http://localhost:3001/api-docs`
- Repo Service Swagger：`http://localhost:3002/api-docs`

## repo-service 当前作用

`packages/repo-service` 是一个可选辅助服务。

当前代码里，它只被 `packages/integration` 用作 `codeSize` 的本地兜底计算服务：

1. 克隆目标仓库
2. 执行 `cloc`
3. 将结果写回数据库中的 `codeSize`
4. 删除临时克隆目录

如果 `packages/integration` 没有配置 `REPO_SERVICE_URL`，就不会调用 `repo-service`。

## 仓库脚本

根目录常用脚本：

- `pnpm dev`：启动 API 服务和前端
- `pnpm dev-integ`：启动 integration
- `pnpm dev-repo-server`：启动 repo-service
- `pnpm test`：运行 Vitest
- `pnpm lint`：运行 ESLint

## 致谢

OSS Evaluation 当前集成或使用了以下开源项目的数据或能力：

- [OSS Compass](https://github.com/oss-compass/)
- [OpenSSF Scorecard](https://securityscorecards.dev/)
- [OpenDigger](https://github.com/X-lab2017/open-digger)
- [Bundlephobia](https://github.com/pastelsky/bundlephobia)
