alter table github_projects_t
    add latest_release_tag_name varchar(255) null comment '最新正式版release的tag名称' after ai_description,
    add latest_release_published_at varchar(512) null comment '最新正式版release发布时间(ISO字符串)' after latest_release_tag_name;

alter table gitee_projects_t
    add latest_release_tag_name varchar(255) null comment '最新正式版release的tag名称' after ai_description,
    add latest_release_published_at varchar(512) null comment '最新正式版release发布时间(ISO字符串)' after latest_release_tag_name;

alter table gitcode_projects_t
    add latest_release_tag_name varchar(255) null comment '最新正式版release的tag名称' after ai_description,
    add latest_release_published_at varchar(512) null comment '最新正式版release发布时间(ISO字符串)' after latest_release_tag_name;

create index github_projects_t_latest_release_published_at_idx
    on github_projects_t (latest_release_published_at);

create index gitee_projects_t_latest_release_published_at_idx
    on gitee_projects_t (latest_release_published_at);

create index gitcode_projects_t_latest_release_published_at_idx
    on gitcode_projects_t (latest_release_published_at);
