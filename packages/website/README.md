# website

前端站点，基于 Vue 3、TypeScript 和 Vite。

## 作用

该包负责仓库的 Web 前端页面。

## 常用命令

```bash
pnpm -C packages/website dev
pnpm -C packages/website build
pnpm -C packages/website preview
```

对应含义：

- `dev`：启动本地开发服务
- `build`：执行类型检查并产出前端构建结果
- `preview`：本地预览构建产物

## 开发建议

推荐使用支持 Vue 3 + TypeScript 的编辑器环境，例如：

- VS Code
- Volar

该包使用 `vue-tsc` 做 `.vue` 文件的类型检查。
