# 数据库 schema 维护

## 现状

- **`sql/init.sql`** 是唯一的全量初始化脚本(43 张表 + 1 个视图,MySQL 8+),全新部署只需执行它一次。
  - compose 的 `local-mysql` profile 会在数据卷为空时自动导入。
  - 生产外部 MySQL 由 DBA 手工执行:`mysql -h <host> -u <user> -p <db> < sql/init.sql`
- `sql/2024xx.sql`、`sql/202503/`、`sql/202505.sql` 是历史增量变更记录,**已经合并进 `init.sql`**,仅作存档,新部署不需要执行。
- `scripts/gen-init-sql.mjs` 能从 `packages/data-model/models/` 下的 Sequelize 模型重新生成 `init.sql` 骨架(类型映射见脚本内 `TYPE_MAP`)。

## 变更字段时的维护流程(重要)

本项目 **没有自动迁移机制**(Sequelize 不开 `sync`/migration),所以每次表结构变更必须同时做三件事:

1. **改模型**:更新 `packages/data-model/models/` 里对应的 Sequelize 模型。
2. **写增量 SQL**:在 `sql/` 下新建按年月命名的增量脚本(如 `sql/202607.sql`),内容是 `ALTER TABLE ...` 等,用于**已有环境**升级。
3. **同步 `init.sql`**:把同样的变更合并进 `sql/init.sql`(手工改,或跑 `node scripts/gen-init-sql.mjs` 重新生成后人工 review diff),保证**全新环境**一次到位。

> 只改模型不改 SQL 的后果:新环境部署后服务启动报「字段/表不存在」,这是历史上"别人拿到代码无法部署"的主要原因之一。

## 升级已有环境

```bash
# 按时间顺序执行你所缺的增量脚本
mysql -h <host> -u <user> -p <db> < sql/202607.sql
```

建议在增量脚本头部用注释写明:日期、关联 PR/issue、影响的表。

## 校验 schema 是否同步

快速对比当前库与 init.sql 的表数量(注意排除视图,否则数字对不上):

```bash
mysql -h <host> -u <user> -p -N -e "select count(*) from information_schema.tables where table_schema='oss-eval' and table_type='BASE TABLE'"
rg -c 'CREATE TABLE' sql/init.sql
```

两者应一致;不一致说明 init.sql 或目标库落后了。表名级别的精确对比:

```bash
rg -o 'CREATE TABLE `([^`]+)`' -r '$1' sql/init.sql | sort > /tmp/init_tables.txt
mysql -h <host> -u <user> -p -N -e "select table_name from information_schema.tables where table_schema='oss-eval' and table_type='BASE TABLE' order by table_name" > /tmp/db_tables.txt
diff /tmp/init_tables.txt /tmp/db_tables.txt
```

注意:compose 的 `local-mysql` 只在**数据卷为空**时导入 init.sql。如果 init.sql 后来更新了,旧卷不会自动跟进,需要手工执行缺的建表语句,或 `docker compose --profile local-mysql down -v` 后重建。
