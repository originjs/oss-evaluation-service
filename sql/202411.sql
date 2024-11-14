drop table schedule_task_monitor;
create table schedule_task_monitor
(
    id                int auto_increment
        primary key,
    task_id           varchar(255)                        not null comment 'task_id',
    task_name         varchar(255)                        not null comment 'task名称',
    task_desc         varchar(255)                        not null comment 'task描述',
    status            tinyint                             not null comment 'task执行状态：0-执行中；1-执行成功；2-执行失败',
    messaged          tinyint   default 0                 not null comment '是否已经发送通知',
    start_time        timestamp                            not null comment 'task开启时间',
    end_time          timestamp                            null comment 'task结束时间',
    duration          bigint                              null comment 'task运行时间（单位：秒）',
    cron              varchar(64)                         not null comment 'task的cron',
    ip                varchar(32)                         null comment 'task开启的ip地址',
    task_exception    mediumtext charset utf8mb4          null comment 'task的异常',
    is_valid          tinyint   default 1                 null comment '有效标识，1:有效，0无效',
    last_updated_date timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    constraint schedule_task_monitor_task_id_index
        unique (task_id)
)
    comment 'scheduler任务监控';

create index schedule_task_monitor_start_time_end_time_index
    on schedule_task_monitor (start_time, end_time);

create index schedule_task_monitor_status_index
    on schedule_task_monitor (status);

create index schedule_task_monitor_task_name_index
    on schedule_task_monitor (task_name);