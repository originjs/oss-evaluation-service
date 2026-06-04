# landscape

用于生成前端 landscape 展示数据和静态站点。

## 前置依赖

需要先安装 `landscape2`。

示例安装命令：

```bash
powershell -c "irm https://github.com/cncf/landscape2/releases/download/v0.8.1/landscape2-installer.ps1 | iex"
```

## 常用流程

1. 更新 `data.yml`
2. 如需同步数据，执行：

```bash
pnpm -C packages/landscape update
```

3. 构建 landscape：

```bash
pnpm -C packages/landscape build
```

4. 本地预览：

```bash
pnpm -C packages/landscape serve
```
