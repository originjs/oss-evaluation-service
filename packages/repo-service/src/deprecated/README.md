# 已弃用文件说明

该目录保存的是当前架构中已经不再主动使用、但暂时保留作参考的旧实现。

## 已弃用 worker

### `gitWorker.ts`

- 状态：已弃用
- 原因：Git clone 逻辑已经合并进新的 worker 中，不再单独拆分
- 迁移去向：`cloneRepoIfNotExist` 已迁移到 `src/utils/git/gitClone.ts`

### `shellWorker.ts`

- 状态：已弃用
- 原因：已被 `shellWithCloneWorker.ts` 替代
- 替代方式：凡是需要依赖 Git 仓库的 shell 命令，改用 `shellWithCloneWorker`

## 当前仍在使用的 worker

- `shellWithCloneWorker.ts`：执行 shell 命令，并在内部完成仓库克隆
- `sonarScannerWorker.ts`：执行 SonarQube 分析，并在内部完成仓库克隆

## 架构变化

旧结构：

```text
gitWorker + shellWorker -> shellWithCloneWorker
gitWorker + sonarWorker -> sonarScannerWorker
```

现在改为每个 worker 自己负责所需的 Git 操作，减少跨 worker 协调成本。
