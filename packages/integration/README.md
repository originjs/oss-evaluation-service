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

## Docker / Podman 部署

当前仓库已提供 `packages/integration/Dockerfile`，可以直接构建可部署镜像；镜像构建阶段会完成依赖安装，容器启动时直接运行服务，不需要再进入容器手工执行 `pnpm install`。

但数据库 schema **不是 integration 容器自己初始化**。

正确方式是先启动一个通过 `sql/init.sql` 完成初始化的 MySQL 容器，再启动 integration 容器。

示例：

```bash
podman network create oss-eval

podman run -d \
  --name oss-eval-mysql \
  --network oss-eval \
  -e MYSQL_ROOT_PASSWORD=oss-eval-root \
  -e MYSQL_DATABASE=oss-eval \
  -p 3306:3306 \
  -v "$(pwd)/sql/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro" \
  mysql:9.0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci

podman build -f packages/integration/Dockerfile -t oss-evaluation-integration .

podman run --rm \
  --name oss-eval-integration \
  --network oss-eval \
  -p 3001:3001 \
  --env-file packages/integration/.env \
  -e DATABASE_URL='mysql://root:oss-eval-root@oss-eval-mysql:3306/oss-eval' \
  oss-evaluation-integration
```

说明：

- 构建上下文必须是仓库根目录，因为镜像需要访问 workspace 根配置和内部依赖包
- integration 依赖 `data-model`，因此运行前数据库必须已经完成 schema 初始化
- 运行时仍然需要通过环境变量提供数据库连接、外部 API token 等配置
- 该镜像不是类似 Java `jar` 的单文件产物，本质上仍然是 Node.js 运行时 + 项目代码 + `node_modules`

## 文档地址

启动后可访问：

- `http://localhost:3001/api-docs`
