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

## 调度说明

定时任务入口位于：

- `bin/www.js`
- `scheduler/job.js`
- `scheduler/config.js`

生产环境下会按配置启动定时任务；开发环境默认不启动调度。

## 与 repo-service 的关系

`integration` 在同步项目 `codeSize` 时，优先尝试远程 API。

只有在远程结果不可用，且配置了 `REPO_SERVICE_URL` 时，才会回退调用 `repo-service` 的 `POST /repo/getCodeSize`。

## 文档地址

启动后可访问：

- `http://localhost:3001/api-docs`
