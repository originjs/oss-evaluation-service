# api-sdk

仓库内用于封装外部 API 调用的轻量 SDK 集合目录。

## 目录说明

当前主要包含：

- `github/`：GitHub 相关 SDK
- `coze/`：Coze 相关 SDK
- `extChat.js`、`result.js`、`util.js`：辅助封装文件

## 用途

这些 SDK 主要供 `integration` 等服务复用，用来隔离外部平台调用细节。

该目录本身不是单独发布包，但其子目录中包含可被 workspace 引用的包。
