-- 为 gitcode_projects_t 新增 openharmony_version 字段：
-- 记录 OpenHarmony 仓库适配的鸿蒙大版本列表（仅 >= v6.0 的 release），JSON 数组，如 ["v6.1-release","v6.0-release"]。
-- 已升级到当前 main（已执行过 202606.sql）的环境按顺序执行本脚本补上该列。
alter table gitcode_projects_t
    add openharmony_version json null comment 'OpenHarmony 适配的鸿蒙大版本列表（仅 >= v6.0 的 release），JSON 数组，如 ["v6.1-release","v6.0-release"]' after latest_release_published_at;
