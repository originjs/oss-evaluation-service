# 架构与服务说明

本仓库是一个 pnpm monorepo,所有代码在 `packages/` 下。整体是「前端 + 后端 API + 数据集成 + 可选辅助服务」的结构,数据都存在同一个 MySQL 中。

## 总览

```
                       ┌──────────────┐
   浏览器 ───────────► │   website    │  Vue3 前端 (nginx, :8080)
                       └──────┬───────┘
                              │ /oss-evaluation-api/** 反向代理
                              ▼
                       ┌──────────────┐
                       │  api-server  │  查询/读 API (:3000)
                       └──────┬───────┘
                              │ 读                    ┌──────────────┐
                              ▼                       │ integration  │ 写 (:3001)
                       ┌──────────────┐ ◄──────────── │ 定时任务+同步API│
                       │    MySQL     │               └──────┬───────┘
                       └──────────────┘                      │ 可选回退
                                                             ▼
                                                      ┌──────────────┐
                                                      │ repo-service │ cloc 统计 (:3002)
                                                      └──────────────┘
```

简单说:**integration 负责把外部数据(GitHub/Gitee/GitCode/OSS Compass/Scorecard/OpenDigger/npm 等)抓取写入 MySQL;api-server 负责把 MySQL 里的数据查出来给前端;website 是展示界面;repo-service 是 integration 的可选兜底计算服务。**

## 各 package 职责

### 部署为服务的包

| 包 | 名称 | 端口 | 职责 |
|---|---|---|---|
| `packages/website` | `@orginjs/oss-evaluation-website` | 8080 (容器内 80) | Vue 3 + Vite + Element Plus 前端站点。展示项目评估、对比、benchmark 等页面。构建产物为静态文件,由 nginx 托管并把 `/oss-evaluation-api/**` 反向代理到 api-server |
| `packages/api-server` | `@orginjs/oss-evaluation-api-server` | 3000 | Express + tsoa 的读 API。前端的所有数据查询走这里;还提供 benchmark 文件上传(`UPLOAD_PATH`)、导出 Excel 等。可选调用 integration(`INTEGRATION_URL`)触发 benchmark 同步。Swagger: `/api-docs` |
| `packages/integration` | `@orginjs/oss-evaluation-integration` | 3001 | 数据集成服务。包含定时任务(scheduler)和手动触发的 `/sync/**` API,从 GitHub、Gitee、GitCode、npm、OSS Compass、OpenSSF Scorecard、OpenDigger、Bundlephobia 等拉取数据写入 MySQL。也是唯一调用 AI(Coze / 外部 AI 服务)的地方。Swagger: `/api-docs` |
| `packages/repo-service` | `@orginjs/repo-service` | 3002 | 可选辅助服务,只有一个接口 `POST /repo/getCodeSize`:克隆目标仓库 → 执行 `cloc` → 把代码行数写回数据库 → 清理临时目录。只有 integration 配置了 `REPO_SERVICE_URL` 且远程 code size API 不可用时才会被调用。运行时依赖 `git` 和 `cloc` 命令 |

### 仅作为依赖库 / 工具的包(不单独部署)

| 包 | 职责 |
|---|---|
| `packages/data-model` | Sequelize 数据模型(45 个模型文件,对应 43 张表 + 1 个视图)+ winston 日志封装。被 api-server / integration / repo-service 共用,数据库连接从 `DATABASE_URL` 读取 |
| `packages/util` | 通用工具函数(TypeScript,需 `pnpm build` 产出 `dist/`)。**其他服务启动前必须先 build 它**,各服务的 `prestart`/`predev` 钩子和 Dockerfile 都已处理 |
| `packages/shared-components` | 前端共享 Vue 组件 + API client(`HttpRequest.ts`,后端地址由构建期变量 `VITE_BACKEND_SERVICE_URL` 决定) |
| `packages/api-sdk` | GitHub 等平台 API 的轻量 SDK 封装,被 integration 使用 |
| `packages/landscape` | **不是常驻服务,因此不在 docker-compose 里**。它是一个离线生成工具:`pnpm -C packages/landscape update` 从 MySQL 读数据生成 `data.yml` 和 logo SVG,再用 CNCF 的 `landscape2` 二进制 `build` 出一个独立静态站点(`serve` 仅用于本地预览)。它没有 HTTP 服务进程、没有被任何服务调用;website 里的 `TechLandscape.vue` 用的是 `shared-components/landscape-view` 组件从 api-server 取数,与这个包无运行时关系。产物是静态文件,部署方式是发布到任意静态托管,而不是跑容器 |

## 服务间依赖关系

- **website → api-server**:前端所有请求经 nginx 代理到 api-server。前端 API 基础路径在**构建期**通过 `VITE_BACKEND_SERVICE_URL` 写死,默认 `/oss-evaluation-api`(配合 nginx 代理)。
- **api-server → integration**(可选):仅 benchmark 同步路径需要,由 `INTEGRATION_URL` 控制;不配置则相关接口报错但其余功能正常。
- **integration → repo-service**(可选):仅 codeSize 兜底计算,由 `REPO_SERVICE_URL` 控制;不配置则跳过。
- **所有后端服务 → MySQL**:`DATABASE_URL` 必填。schema 见 `sql/init.sql`。

## 数据库

- 主库:MySQL 8+,连接串 `DATABASE_URL`(格式 `mysql://user:pass@host:3306/db`)。
- 初始化:`sql/init.sql`(由 `scripts/gen-init-sql.mjs` 从 Sequelize 模型 + 增量 SQL 生成)。**全新数据库必须先执行一次**;compose 的 `local-mysql` profile 会自动导入。
- `DATABASE_EXT_URL`:个别扩展查询用的第二个库,可不配。

## 定时任务(scheduler)

只存在于 integration:

- `NODE_ENV=production` 且 `DISABLE_SCHEDULE_JOB` 为空 → 启动定时任务。
- 其他情况只提供手动 `/sync/**` API。
- AI 相关路径(alternative / aiClassification / projectDescription)**不会**被 scheduler 自动触发,只有调 API 时才执行。

## 环境变量

完整清单见根目录 `.env.example`(带服务名前缀,用于 docker compose),各服务单独部署时看 `packages/<service>/.env.example`。

几个易错点:

- `GITHUB_TOKEN` / `GITEE_TOKEN` / `GITCODE_TOKEN` 必须是 **JSON 数组字符串**(代码里 `JSON.parse()`),没有 token 也要写 `[]`。
- `VITE_BACKEND_SERVICE_URL` 是**前端构建期**变量,改了必须重新构建 website 镜像。
- `DISABLE_SCHEDULE_JOB` 是"非空即禁用",要开 scheduler 必须设为空字符串。
