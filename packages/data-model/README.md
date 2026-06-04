# data-model

数据库模型与基础数据访问层。

## 作用

该包集中维护：

- Sequelize 数据库连接
- 日志能力
- 各类数据库模型导出

`index.js` 会统一导出大量模型，以及：

- `logger`
- `sequelize`
- `sequelizeExt`

供 `api-server`、`integration`、`repo-service` 等服务复用。

## 主要环境变量

- `DATABASE_URL`：主数据库连接
- `DATABASE_EXT_URL`：可选的扩展数据库连接

## 当前特点

- 使用 `mysql2` 作为 MySQL 驱动
- 统一通过 Sequelize 建模
- 默认关闭 SSL
- 内置连接池配置

## 使用方式

该包当前没有独立启动命令，主要作为被其他服务引用的共享数据层。
