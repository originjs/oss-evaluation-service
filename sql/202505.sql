alter table github_projects_t
    add platform_type int default 1 not null comment '项目的托管平台类型：1-Github 2-Gitee 3-GitCode' after id;

alter table github_projects_t
    add p_id varchar(32) as (concat(platform_type, '#', id)) stored after platform_type;

create index p_id_index
    on github_projects_t (p_id);

create table gitee_projects_t
(
    id                       int                                 not null
        primary key,
    platform_type            int       default 2                 not null comment '项目的托管平台类型：1-Github 2-Gitee 3-GitCode',
    p_id                     varchar(32) as (concat(platform_type, '#', id)) stored,
    name                     varchar(512)                        not null,
    full_name                varchar(512)                        null,
    type                     varchar(10)                         null,
    html_url                 varchar(512)                        null,
    description              text                                null,
    private_flag             varchar(10)                         null,
    owner_name               varchar(512)                        null,
    fork_flag                varchar(10)                         null,
    created_at               varchar(512)                        null,
    updated_at               varchar(512)                        null,
    pushed_at                varchar(512)                        null,
    clone_url                varchar(512)                        null,
    code_size                int                                 null,
    stargazers_count         int                                 null,
    watchers_count           int                                 null,
    language                 varchar(512)                        null,
    has_issues               varchar(10)                         null,
    forks_count              int                                 null,
    open_issues_count        int                                 null,
    license                  varchar(512)                        null,
    default_branch           varchar(512)                        null,
    owner_avatar_url         varchar(512)                        null,
    owner_type               varchar(255)                        null,
    owner_id                 varchar(512)                        null,
    owner_html_url           varchar(512)                        null,
    ssh_url                  varchar(512)                        null,
    home_page                varchar(512)                        null,
    has_wiki                 varchar(10)                         null,
    has_pages                varchar(10)                         null,
    open_ai_remark           varchar(500)                        null,
    open_ai_recommend_remark varchar(500)                        null,
    question_info            varchar(1000)                       null,
    prompt                   mediumtext                          null,
    integrated_state         int       default 0                 not null,
    contributors             int                                 null,
    dependent_repositories   bigint                              null,
    dependent_packages       bigint                              null,
    last_updated_date        timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    record_desc              varchar(255)                        null,
    data_type                tinyint   default 1                 not null,
    ai_description           json                                null comment 'ai生成的软件描述'
);

create index gitee_projects_t_html_url_index
    on gitee_projects_t (html_url);

create index index_1
    on gitee_projects_t (integrated_state);

create index p_id_index
    on gitee_projects_t (p_id);

create table gitcode_projects_t
(
    id                       int                                 not null
        primary key,
    platform_type            int       default 3                 not null comment '项目的托管平台类型：1-Github 2-Gitee 3-GitCode',
    p_id                     varchar(32) as (concat(platform_type, _utf8mb4'#', id)) stored,
    name                     varchar(512)                        not null,
    full_name                varchar(512)                        null,
    type                     varchar(10)                         null,
    html_url                 varchar(512)                        null,
    description              text                                null,
    private_flag             varchar(10)                         null,
    owner_name               varchar(512)                        null,
    fork_flag                varchar(10)                         null,
    created_at               varchar(512)                        null,
    updated_at               varchar(512)                        null,
    pushed_at                varchar(512)                        null,
    clone_url                varchar(512)                        null,
    code_size                int                                 null,
    stargazers_count         int                                 null,
    watchers_count           int                                 null,
    language                 varchar(512)                        null,
    forks_count              int                                 null,
    open_issues_count        int                                 null,
    license                  varchar(512)                        null,
    default_branch           varchar(512)                        null,
    owner_avatar_url         varchar(512)                        null,
    owner_type               varchar(255)                        null,
    owner_id                 varchar(512)                        null,
    owner_html_url           varchar(512)                        null,
    ssh_url                  varchar(512)                        null,
    home_page                varchar(512)                        null,
    has_wiki                 varchar(10)                         null,
    has_pages                varchar(10)                         null,
    open_ai_remark           varchar(500)                        null,
    open_ai_recommend_remark varchar(500)                        null,
    question_info            varchar(1000)                       null,
    prompt                   mediumtext                          null,
    integrated_state         int       default 0                 not null,
    contributors             int                                 null,
    dependent_repositories   bigint                              null,
    dependent_packages       bigint                              null,
    last_updated_date        timestamp default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    record_desc              varchar(255)                        null,
    data_type                tinyint   default 1                 not null,
    ai_description           json                                null comment 'ai生成的软件描述'
);

create index gitcode_projects_t_html_url_index
    on gitcode_projects_t (html_url);

create index index_1
    on gitcode_projects_t (integrated_state);

create index p_id_index
    on gitcode_projects_t (p_id);

create view view_projects as
select github.p_id                        AS p_id,
       github.platform_type               AS platform_type,
       github.id                          AS id,
       github.name                        AS name,
       github.full_name                   AS full_name,
       github.type                        AS type,
       github.html_url                    AS html_url,
       github.description                 AS description,
       github.private_flag                AS private_flag,
       github.owner_name                  AS owner_name,
       github.fork_flag                   AS fork_flag,
       github.created_at                  AS created_at,
       github.updated_at                  AS updated_at,
       github.pushed_at                   AS pushed_at,
       github.git_url                     AS git_url,
       github.clone_url                   AS clone_url,
       github.size                        AS size,
       github.stargazers_count            AS stargazers_count,
       github.watchers_count              AS watchers_count,
       github.language                    AS language,
       github.has_issues                  AS has_issues,
       github.forks_count                 AS forks_count,
       github.archived                    AS archived,
       github.disabled                    AS disabled,
       github.open_issues_count           AS open_issues_count,
       github.allow_forking               AS allow_forking,
       github.topics                      AS topics,
       github.visibility                  AS visibility,
       github.forks                       AS forks,
       github.open_issues                 AS open_issues,
       github.watchers                    AS watchers,
       github.default_branch              AS default_branch,
       github.owner_avatar_url            AS owner_avatar_url,
       github.owner_type                  AS owner_type,
       github.owner_id                    AS owner_id,
       github.owner_html_url              AS owner_html_url,
       github.ssh_url                     AS ssh_url,
       github.svn_url                     AS svn_url,
       github.home_page                   AS home_page,
       github.has_projects                AS has_projects,
       github.has_downloads               AS has_downloads,
       github.has_wiki                    AS has_wiki,
       github.has_pages                   AS has_pages,
       github.has_discussions             AS has_discussions,
       github.mirror_url                  AS mirror_url,
       github.is_template                 AS is_template,
       github.web_commit_signoff_required AS web_commit_signoff_required,
       github.open_ai_remark              AS open_ai_remark,
       github.open_ai_recommend_remark    AS open_ai_recommend_remark,
       github.question_info               AS question_info,
       github.prompt                      AS prompt,
       github.integrated_state            AS integrated_state,
       github.contributors                AS contributors,
       github.dependent_repositories      AS dependent_repositories,
       github.dependent_packages          AS dependent_packages,
       github.last_updated_date           AS last_updated_date,
       github.record_desc                 AS record_desc,
       github.data_type                   AS data_type,
       github.ai_description              AS ai_description,
       github.code_size                   AS code_size,
       github.license_name                AS license_name
from github_projects_t github
where github.data_type = 1
union all
select gitee.p_id                     AS p_id,
       gitee.platform_type            AS platform_type,
       gitee.id                       AS id,
       gitee.name                     AS name,
       gitee.full_name                AS full_name,
       gitee.type                     AS type,
       gitee.html_url                 AS html_url,
       gitee.description              AS description,
       gitee.private_flag             AS private_flag,
       gitee.owner_name               AS owner_name,
       gitee.fork_flag                AS fork_flag,
       gitee.created_at               AS created_at,
       gitee.updated_at               AS updated_at,
       gitee.pushed_at                AS pushed_at,
       NULL                           AS git_url,
       gitee.clone_url                AS clone_url,
       NULL                           AS size,
       gitee.stargazers_count         AS stargazers_count,
       gitee.watchers_count           AS watchers_count,
       gitee.language                 AS language,
       gitee.has_issues               AS has_issues,
       gitee.forks_count              AS forks_count,
       NULL                           AS archived,
       NULL                           AS disabled,
       gitee.open_issues_count        AS open_issues_count,
       NULL                           AS allow_forking,
       NULL                           AS topics,
       NULL                           AS visibility,
       NULL                           AS forks,
       NULL                           AS open_issues,
       NULL                           AS watchers,
       gitee.default_branch           AS default_branch,
       gitee.owner_avatar_url         AS owner_avatar_url,
       gitee.owner_type               AS owner_type,
       gitee.owner_id                 AS owner_id,
       gitee.owner_html_url           AS owner_html_url,
       gitee.ssh_url                  AS ssh_url,
       NULL                           AS svn_url,
       gitee.home_page                AS home_page,
       NULL                           AS has_projects,
       NULL                           AS has_downloads,
       gitee.has_wiki                 AS has_wiki,
       gitee.has_pages                AS has_pages,
       NULL                           AS has_discussions,
       NULL                           AS mirror_url,
       NULL                           AS is_template,
       NULL                           AS web_commit_signoff_required,
       gitee.open_ai_remark           AS open_ai_remark,
       gitee.open_ai_recommend_remark AS open_ai_recommend_remark,
       gitee.question_info            AS question_info,
       gitee.prompt                   AS prompt,
       gitee.integrated_state         AS integrated_state,
       gitee.contributors             AS contributors,
       gitee.dependent_repositories   AS dependent_repositories,
       gitee.dependent_packages       AS dependent_packages,
       gitee.last_updated_date        AS last_updated_date,
       gitee.record_desc              AS record_desc,
       gitee.data_type                AS data_type,
       gitee.ai_description           AS ai_description,
       gitee.code_size                AS code_size,
       gitee.license                  AS license_name
from gitee_projects_t gitee
where gitee.data_type = 1
union all
select gitcode.p_id                     AS p_id,
       gitcode.platform_type            AS platform_type,
       gitcode.id                       AS id,
       gitcode.name                     AS name,
       gitcode.full_name                AS full_name,
       gitcode.type                     AS type,
       gitcode.html_url                 AS html_url,
       gitcode.description              AS description,
       gitcode.private_flag             AS private_flag,
       gitcode.owner_name               AS owner_name,
       gitcode.fork_flag                AS fork_flag,
       gitcode.created_at               as created_at,
       gitcode.updated_at               as updated_at,
       gitcode.pushed_at                as pushed_at,
       NULL                             AS git_url,
       gitcode.clone_url                AS clone_url,
       NULL                             AS size,
       gitcode.stargazers_count         AS stargazers_count,
       gitcode.watchers_count           AS watchers_count,
       gitcode.language                 AS language,
       NULL                             AS has_issues,
       gitcode.forks_count              AS forks_count,
       NULL                             AS archived,
       NULL                             AS disabled,
       gitcode.open_issues_count        AS open_issues_count,
       NULL                             AS allow_forking,
       NULL                             AS topics,
       NULL                             AS visibility,
       NULL                             AS forks,
       NULL                             AS open_issues,
       NULL                             AS watchers,
       gitcode.default_branch           AS default_branch,
       gitcode.owner_avatar_url         AS owner_avatar_url,
       gitcode.owner_type               AS owner_type,
       gitcode.owner_id                 AS owner_id,
       gitcode.owner_html_url           AS owner_html_url,
       gitcode.ssh_url                  AS ssh_url,
       NULL                             AS svn_url,
       gitcode.home_page                AS home_page,
       NULL                             AS has_projects,
       NULL                             AS has_downloads,
       gitcode.has_wiki                 AS has_wiki,
       gitcode.has_pages                AS has_pages,
       NULL                             AS has_discussions,
       NULL                             AS mirror_url,
       NULL                             AS is_template,
       NULL                             AS web_commit_signoff_required,
       gitcode.open_ai_remark           AS open_ai_remark,
       gitcode.open_ai_recommend_remark AS open_ai_recommend_remark,
       gitcode.question_info            AS question_info,
       gitcode.prompt                   AS prompt,
       gitcode.integrated_state         AS integrated_state,
       gitcode.contributors             AS contributors,
       gitcode.dependent_repositories   AS dependent_repositories,
       gitcode.dependent_packages       AS dependent_packages,
       gitcode.last_updated_date        AS last_updated_date,
       gitcode.record_desc              AS record_desc,
       gitcode.data_type                AS data_type,
       gitcode.ai_description           AS ai_description,
       gitcode.code_size                AS code_size,
       gitcode.license                  AS license_name
from gitcode_projects_t gitcode
where gitcode.data_type = 1;

alter table alternative_projects
    change project_id p_id varchar(32) null after id;

alter table alternative_projects
    modify alternative_id varchar(32) null;

update alternative_projects
set p_id = concat(1, '#', p_id)
where p_id is not null;

update alternative_projects
set alternative_id = concat(1, '#', alternative_id)
where alternative_id is not null;

alter table benchmark
    change project_id p_id varchar(32) not null;

update benchmark
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table benchmark_version_score
    change project_id p_id varchar(32) not null;

update benchmark_version_score
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table benchmark_version_score_sw
    change project_id p_id varchar(32) not null;

update benchmark_version_score_sw
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table cncf_document_score
    change project_id p_id varchar(32) null comment 'project id';

update cncf_document_score
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table cncf_document_score_only
    change project_id p_id varchar(32) default 0 not null comment 'project id';

update cncf_document_score_only
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table compass_activity_detail
    change project_id p_id varchar(32) null comment 'project id';

update compass_activity_detail
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table compass_group_activity_detail
    change project_id p_id varchar(32) null comment 'project id';

update compass_group_activity_detail
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table criticality_score
    change project_id p_id varchar(32) not null;

update criticality_score
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table github_projects_dependencies
    change project_id p_id varchar(32) null;

alter table github_projects_dependencies
    change dependent_project_id dependent_p_id varchar(32) null;

update github_projects_dependencies
set p_id = concat(1, '#', p_id)
where p_id is not null;

update github_projects_dependencies
set dependent_p_id = concat(1, '#', dependent_p_id)
where dependent_p_id is not null;

alter table github_projects_history
    change project_id p_id varchar(32) not null;

update github_projects_history
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table github_projects_stargazers_trend
    change project_id p_id varchar(32) not null comment '项目ID';

update github_projects_stargazers_trend
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table opendigger_info
    change project_id p_id varchar(32) not null;

update opendigger_info
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table oss_evaluate_summary_history
    change project_id p_id varchar(32) not null;

update oss_evaluate_summary_history
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table oss_evaluation_summary
    change project_id p_id varchar(32) not null;

update oss_evaluation_summary
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table oss_github_fork
    change project_id p_id varchar(32) not null;

update oss_github_fork
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table oss_gitlab_fork
    change github_project_id p_id varchar(32) not null;

alter table oss_gitlab_fork
    change github_full_name p_full_name varchar(128) default '' not null;

update oss_gitlab_fork
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table ossinsight_creators_countries
    change project_id p_id varchar(32) null;

drop index ossinsight_creators_countries_project_id_type_index on ossinsight_creators_countries;

create index ossinsight_creators_countries_p_id_type_index
    on ossinsight_creators_countries (p_id, type);

update ossinsight_creators_countries
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table ossinsight_creators_countries_api
    change project_id p_id varchar(32) null;

update ossinsight_creators_countries_api
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table ossinsight_creators_organizations
    change project_id p_id varchar(32) null;

update ossinsight_creators_organizations
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table ossinsight_creators_organizations_api
    change project_id p_id varchar(32) null;

update ossinsight_creators_organizations_api
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table ossinsight_pull_request_creators_countries
    change project_id p_id varchar(32) null;

update ossinsight_pull_request_creators_countries
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table package_download_count
    change project_id p_id varchar(32) null;

update package_download_count
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table package_download_count_20240327
    change project_id p_id varchar(32) null;

update package_download_count_20240327
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table project_contributions
    change project_id p_id varchar(32) not null;

update project_contributions
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table project_packages
    change project_id p_id varchar(32) not null;

update project_packages
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table project_tech_stack
    change project_id p_id varchar(32) not null;

update project_tech_stack
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table scorecard_info
    change project_id p_id varchar(32) not null first;

update scorecard_info
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table scorecard_info_total_only
    change project_id p_id varchar(32) not null first;

update scorecard_info_total_only
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table sonar_cloud_project
    change github_project_id p_id varchar(32) default -1 not null;

alter table sonar_cloud_project
    change fork_github_id fork_p_id varchar(32) default -1 not null;

drop index sonar_cloud_project_github_project_id_index on sonar_cloud_project;

create index sonar_cloud_project_p_id_index
    on sonar_cloud_project (p_id);

update sonar_cloud_project
set p_id = concat(1, '#', p_id)
where p_id <> -1;

alter table stackoverflow_survey_result
    change project_id p_id varchar(32) null comment '项目id';

update stackoverflow_survey_result
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table state_of_js_detail
    change project_id p_id varchar(32) null comment '项目id';

drop index state_of_js_detail_project_id_index on state_of_js_detail;

create index state_of_js_detail_p_id_index
    on state_of_js_detail (p_id);

update state_of_js_detail
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table trend_history
    change project_id p_id varchar(32) not null;

update trend_history
set p_id = concat(1, '#', p_id)
where p_id is not null;

alter table trend_rank_history
    change project_id p_id varchar(32) not null;

update trend_rank_history
set p_id = concat(1, '#', p_id)
where p_id is not null;
