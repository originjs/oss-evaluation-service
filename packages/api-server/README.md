# api-server

主 API 服务，负责对外提供项目评估相关的 HTTP 接口。

## 作用

该包基于 Express + tsoa，承担仓库中的主业务接口能力，包括但不限于：

- 项目详情查询
- 趋势与榜单查询
- 基准测试结果接口
- 新项目申请相关接口
- 报表导出

服务启动后会自动注册 tsoa 生成的路由，并暴露 Swagger 文档。

## 默认端口

- `3000`

可通过 `PORT` 环境变量覆盖。

## 常用命令

```bash
pnpm -C packages/api-server dev
pnpm -C packages/api-server build
pnpm -C packages/api-server start
pnpm -C packages/api-server test
```

对应含义：

- `dev`：构建后以 nodemon 启动开发服务
- `build`：生成 tsoa 路由与 Swagger，并编译 TypeScript
- `start`：启动已构建产物
- `test`：运行 Vitest

## 依赖说明

该服务依赖以下内部包：

- `@orginjs/oss-evaluation-data-model`
- `@orginjs/oss-evaluation-util`

启动前需要保证数据库连接配置可用。

## 文档地址

启动后可访问：

- `http://localhost:3000/api-docs`
