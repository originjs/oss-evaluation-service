-- add primary key
alter table new_project_apply add id char(36) null;
alter table new_project_apply modify id char(36) not null default (uuid()) first;
alter table new_project_apply add constraint new_project_apply_pk primary key (id);


-- add field `filename` and `env_info`
alter table new_project_apply
    add filename varchar(256) default '' not null comment 'benchmark上传的文件名称';

alter table new_project_apply
    add env_info varchar(512) default '' not null comment 'benchmark的环境信息';
