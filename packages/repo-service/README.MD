# repo-service

`repo-service` 是 `packages/integration` 的一个可选辅助服务。

## HTTP 接口

当前只暴露一个接口：

- `POST /repo/getCodeSize`

## 当前职责

收到仓库参数后，服务会：

1. 将仓库克隆到 `REPO_DIR`
2. 执行 `cloc --timeout 0 .`
3. 解析总代码行数
4. 按平台写回数据库中的 `codeSize`
5. 清理本地临时克隆目录

接口本身会很快返回；实际的克隆和 `cloc` 计算在 worker 线程中异步执行。

## 当前调用方

当前仓库里，只有 `packages/integration/controllers/projectCodeSize.js` 会调用这个服务。

`integration` 的逻辑是：

1. 先尝试远程 code size API
2. 远程结果不可用时，才回退到 `repo-service`
3. 只有配置了 `REPO_SERVICE_URL` 时，才会真的发起调用

因此：

- 不配置 `REPO_SERVICE_URL`：不会调用 `repo-service`
- 不启动 `repo-service`：只要没有配置 `REPO_SERVICE_URL`，也不会影响 integration 的其他流程

## 运行所需环境变量

环境变量示例见：

```bash
packages/repo-service/.env.example
```

这个文件只适用于 `repo-service`。部署其他服务时，不要共用这里的 `PORT`。

最小配置：

```env
DATABASE_URL=mysql://oss_eval_user:password@mysql-host.example.com:3306/oss-eval
PORT=3002
REPO_DIR=/tmp/oss-evaluation-repos
GITHUB_TOKEN=[]
GITEE_TOKEN=[]
GITCODE_TOKEN=[]
```

注意：`GITHUB_TOKEN` / `GITEE_TOKEN` / `GITCODE_TOKEN` 必须是 JSON 数组字符串。

## 本地启动

```bash
pnpm install
pnpm dev-repo-server
```

Swagger 地址：

- `http://localhost:3002/api-docs`

## Docker 现状

当前仓库里的 `Dockerfile` **不是** 一个可直接用于标准生产部署的自包含镜像。

它现在的行为是：

- 在镜像里安装系统依赖
- 容器启动时执行 `pnpm install && pnpm start`
- 假定代码目录已经存在于容器内的 `/repo-service`
- 没有把源码 `COPY` 进镜像
- 没有在镜像构建阶段执行 `pnpm build`

这意味着当前 Docker 方式更接近：

- 先把代码挂载或放进容器
- 再在容器里安装依赖
- 然后启动服务

而不是常见的“构建期打包、运行期直接启动”的生产镜像。

## Docker 额外注意事项

当前代码和 Dockerfile 还有一个端口差异：

- 服务默认监听 `3002`
- Dockerfile 里写的是 `EXPOSE 3000`

如果继续沿用当前 Dockerfile，需要额外统一端口配置：

- 要么设置 `PORT=3000`
- 要么实际暴露并映射 `3002`
