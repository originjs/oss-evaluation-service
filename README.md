# oss-evaluation-service

开源项目评估平台 monorepo。

## 本地开发

### 前置依赖

- Node.js 20+
- pnpm
- Docker / Docker Compose

### 启动本地 MySQL

```bash
docker compose up -d
```

当前 `docker-compose.yml` 只负责启动 MySQL。

### 环境变量

按需为不同服务准备各自的 `.env` 文件。

最少需要为 `packages/api-server` 提供数据库连接，例如：

```env
DATABASE_URL='mysql://your_db_user:your_password@your_db_server/your_dev_db_name'
```

`packages/integration` 与 `packages/repo-service` 还需要各自的数据源令牌、任务配置和运行参数。

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
