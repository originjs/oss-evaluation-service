# github-sdk

GitHub API 封装包。

## 作用

当前对外提供的能力包括：

- fork 仓库
- 删除 fork
- 查询仓库信息
- 搜索项目
- 获取仓库跳转地址

默认会优先使用 `GITHUB_TOKEN` 环境变量里按顺序配置的 token，验证后选择第一个有效 token；也可以在实例化时手动传入 token。

## 包名

- `@orginjs/github-sdk`

## 使用方式

该包供仓库内其他服务调用，不作为独立进程运行。
