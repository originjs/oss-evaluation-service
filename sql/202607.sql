-- 为 gitcode_projects_t 新增 openharmony_version 字段：
-- 记录 OpenHarmony 仓库适配的鸿蒙大版本列表（仅 >= v6.0 的 release），JSON 数组，如 ["v6.1-release","v6.0-release"]。
--
-- 已升级到当前 main（已执行过 202606.sql）的环境也需要按顺序执行本脚本补上该列。
-- MySQL 8.0 的 ALTER TABLE 不支持 ADD COLUMN IF NOT EXISTS，这里用 INFORMATION_SCHEMA + 动态 SQL
-- 做成独立可重复执行：列已存在时跳过，避免重复执行报错。
set @col_exists = (select count(*)
                   from information_schema.columns
                   where table_schema = database()
                     and table_name = 'gitcode_projects_t'
                     and column_name = 'openharmony_version');

set @ddl = if(@col_exists = 0,
              'alter table gitcode_projects_t add openharmony_version json null comment ''OpenHarmony 适配的鸿蒙大版本列表（仅 >= v6.0 的 release），JSON 数组，如 ["v6.1-release","v6.0-release"]'' after latest_release_published_at',
              'select 1');

prepare stmt from @ddl;
execute stmt;
deallocate prepare stmt;
