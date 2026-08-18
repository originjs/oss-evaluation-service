-- ==================================================================
-- 统一项目表架构迁移脚本 (修复版 - 处理已存在的表)
-- ==================================================================

-- ==================================================================
-- 迁移前检查（请手动执行后再运行本脚本）
-- ==================================================================
-- 1. 检查是否已存在备份表（如果存在说明已迁移过，请勿重复执行）：
--    SELECT 1 FROM information_schema.TABLES 
--    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'github_projects_t_backup_20260810';
-- 2. 检查源表是否存在：
--    DESCRIBE github_projects_t;
--    DESCRIBE gitee_projects_t;
--    DESCRIBE gitcode_projects_t;

-- ==================================================================
-- 第一步：重命名原表为备份表（先保存数据，防止丢失）
-- ==================================================================

RENAME TABLE github_projects_t TO github_projects_t_backup_20260810;
RENAME TABLE gitee_projects_t TO gitee_projects_t_backup_20260810;
RENAME TABLE gitcode_projects_t TO gitcode_projects_t_backup_20260810;

SELECT '原表重命名为备份表完成' as result;

-- ==================================================================
-- 第二步：创建统一表
-- ==================================================================

CREATE TABLE unified_projects_t (
    p_id VARCHAR(32) NOT NULL COMMENT '统一项目ID',
    platform_type INT NOT NULL COMMENT '平台类型',
    id INT NOT NULL COMMENT '平台原始项目ID',
    
    -- 基础字段
    name VARCHAR(512) COMMENT '项目名称',
    full_name VARCHAR(512) COMMENT '项目完整名称',
    type VARCHAR(10) COMMENT '项目类型',
    html_url VARCHAR(512) COMMENT '项目主页URL',
    description TEXT COMMENT '项目描述',
    private_flag VARCHAR(10) COMMENT '是否私有项目',
    owner_name VARCHAR(512) COMMENT '所有者名称',
    fork_flag VARCHAR(10) COMMENT '是否为Fork',
    created_at VARCHAR(512) COMMENT '创建时间',
    updated_at VARCHAR(512) COMMENT '更新时间',
    pushed_at VARCHAR(512) COMMENT '推送时间',
    
    -- URL字段
    git_url VARCHAR(512) COMMENT 'Git URL (GitHub特有)',
    clone_url VARCHAR(512) COMMENT '克隆URL',
    size INT COMMENT '项目大小 (GitHub特有)',
    code_size INT COMMENT '代码大小',
    
    -- 统计字段
    stargazers_count INT COMMENT '星标数量',
    watchers_count INT COMMENT '关注者数量',
    language VARCHAR(512) COMMENT '主要语言',
    has_issues VARCHAR(10) COMMENT '是否有Issues (Gitee有，GitCode无)',
    forks_count INT COMMENT 'Fork数量',
    archived VARCHAR(10) COMMENT '是否归档 (GitHub特有)',
    disabled VARCHAR(10) COMMENT '是否禁用 (GitHub特有)',
    open_issues_count INT COMMENT '开放Issues数量',
    license VARCHAR(512) COMMENT '许可证',
    allow_forking VARCHAR(255) COMMENT '是否允许Fork (GitHub特有)',
    topics VARCHAR(512) COMMENT '项目主题标签 (GitHub特有)',
    visibility VARCHAR(255) COMMENT '可见性 (GitHub特有)',
    
    -- 备用统计字段
    forks INT COMMENT 'Fork数量 (备用, GitHub特有)',
    open_issues INT COMMENT '开放Issues数量 (备用, GitHub特有)',
    watchers INT COMMENT '关注者数量 (备用, GitHub特有)',
    
    -- 分支和所有者信息
    default_branch VARCHAR(512) COMMENT '默认分支',
    owner_avatar_url VARCHAR(512) COMMENT '头像URL',
    owner_type VARCHAR(255) COMMENT '所有者类型',
    owner_id VARCHAR(512) COMMENT '所有者ID',
    owner_html_url VARCHAR(512) COMMENT '所有者主页',
    
    -- SSH和SVN
    ssh_url VARCHAR(512) COMMENT 'SSH URL',
    svn_url VARCHAR(512) COMMENT 'SVN URL (GitHub特有)',
    home_page VARCHAR(512) COMMENT '主页',
    
    -- 功能标志
    has_projects VARCHAR(10) COMMENT '是否有Projects (GitHub特有)',
    has_downloads VARCHAR(10) COMMENT '是否有Downloads (GitHub特有)',
    has_wiki VARCHAR(10) COMMENT '是否有Wiki',
    has_pages VARCHAR(10) COMMENT '是否有Pages',
    has_discussions VARCHAR(10) COMMENT '是否有Discussions (GitHub特有)',
    mirror_url VARCHAR(512) COMMENT '镜像URL (GitHub特有)',
    license_name VARCHAR(512) COMMENT '许可证名称',
    is_template VARCHAR(255) COMMENT '是否模板 (GitHub特有)',
    web_commit_signoff_required VARCHAR(255) COMMENT 'Commit签名要求 (GitHub特有)',
    
    -- AI相关
    open_ai_remark VARCHAR(500) COMMENT 'AI分析备注',
    open_ai_recommend_remark VARCHAR(500) COMMENT 'AI推荐备注',
    question_info VARCHAR(1000) COMMENT '问答信息',
    prompt MEDIUMTEXT COMMENT '提示词',
    integrated_state INT COMMENT '集成状态',
    contributors INT COMMENT '贡献者数量',
    dependent_repositories BIGINT COMMENT '依赖仓库',
    dependent_packages BIGINT COMMENT '依赖包',
    record_desc VARCHAR(255) COMMENT '记录描述',
    data_type TINYINT NOT NULL DEFAULT 1 COMMENT '数据类型',
    ai_description JSON COMMENT 'AI描述',
    latest_release_tag_name VARCHAR(255) COMMENT '最新标签',
    latest_release_published_at VARCHAR(512) COMMENT '最新发布时间',
    last_updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新',
    openharmony_version JSON COMMENT 'OpenHarmony 适配的鸿蒙大版本列表（仅 >= v6.0 的 release），JSON 数组，如 ["v6.1-release","v6.0-release"]',
    
    PRIMARY KEY (p_id),
    UNIQUE KEY uk_platform_id (platform_type, id),
    INDEX idx_platform_type (platform_type),
    INDEX idx_html_url (html_url),
    INDEX idx_latest_release (latest_release_published_at),
    INDEX idx_full_name (full_name),
    INDEX idx_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SELECT '统一表创建成功！' as result;

-- ==================================================================
-- 第三步：数据迁移（从备份表迁移到统一表）
-- ==================================================================

-- 迁移GitHub数据
INSERT INTO unified_projects_t (
    p_id, platform_type, id, name, full_name, type, html_url, description,
    private_flag, owner_name, fork_flag, created_at, updated_at, pushed_at,
    git_url, clone_url, size, code_size, stargazers_count, watchers_count,
    language, has_issues, forks_count, archived, disabled, open_issues_count,
    license, allow_forking, topics, visibility, forks, open_issues, watchers,
    default_branch, owner_avatar_url, owner_type, owner_id, owner_html_url,
    ssh_url, svn_url, home_page, has_projects, has_downloads, has_wiki,
    has_pages, has_discussions, mirror_url, license_name, is_template,
    web_commit_signoff_required, open_ai_remark, open_ai_recommend_remark,
    question_info, prompt, integrated_state, contributors,
    dependent_repositories, dependent_packages, record_desc, data_type,
    ai_description, latest_release_tag_name, latest_release_published_at, last_updated_date
)
SELECT
    p_id, platform_type, id, name, full_name, type, html_url, description,
    private_flag, owner_name, fork_flag, created_at, updated_at, pushed_at,
    git_url, clone_url, size, code_size, stargazers_count, watchers_count,
    language, has_issues, forks_count, archived, disabled, open_issues_count,
    license, allow_forking, topics, visibility, forks, open_issues, watchers,
    default_branch, owner_avatar_url, owner_type, owner_id, owner_html_url,
    ssh_url, svn_url, home_page, has_projects, has_downloads, has_wiki,
    has_pages, has_discussions, mirror_url, license_name, is_template,
    web_commit_signoff_required, open_ai_remark, open_ai_recommend_remark,
    question_info, prompt, integrated_state, contributors,
    dependent_repositories, dependent_packages, record_desc, 
    CASE WHEN data_type IS NULL THEN 1 ELSE data_type END as data_type,
    ai_description, latest_release_tag_name, latest_release_published_at, last_updated_date
FROM github_projects_t_backup_20260810;

SELECT 'GitHub数据迁移完成' as result;

-- 迁移Gitee数据
INSERT INTO unified_projects_t (
    p_id, platform_type, id, name, full_name, type, html_url, description,
    private_flag, owner_name, fork_flag, created_at, updated_at, pushed_at,
    clone_url, code_size, stargazers_count, watchers_count, language, 
    has_issues, forks_count, open_issues_count, license,
    default_branch, owner_avatar_url, owner_type, owner_id, owner_html_url,
    ssh_url, home_page, has_wiki, has_pages,
    open_ai_remark, open_ai_recommend_remark, question_info,
    prompt, integrated_state, contributors,
    dependent_repositories, dependent_packages, record_desc, data_type,
    ai_description, latest_release_tag_name, latest_release_published_at, last_updated_date,
    -- GitHub特有字段
    git_url, size, archived, disabled, allow_forking, topics, visibility,
    forks, open_issues, watchers, svn_url, has_projects, has_downloads,
    has_discussions, mirror_url, license_name, is_template, web_commit_signoff_required
)
SELECT
    p_id, platform_type, id, name, full_name, type, html_url, description,
    private_flag, owner_name, fork_flag, created_at, updated_at, pushed_at,
    clone_url, code_size, stargazers_count, watchers_count, language, 
    has_issues, forks_count, open_issues_count, license,
    default_branch, owner_avatar_url, owner_type, owner_id, owner_html_url,
    ssh_url, home_page, has_wiki, has_pages,
    open_ai_remark, open_ai_recommend_remark, question_info,
    prompt, integrated_state, contributors,
    dependent_repositories, dependent_packages, record_desc, 
    CASE WHEN data_type IS NULL THEN 1 ELSE data_type END as data_type,
    ai_description, latest_release_tag_name, latest_release_published_at, last_updated_date,
    -- GitHub特有字段设为NULL
    NULL as git_url, NULL as size, NULL as archived, NULL as disabled,
    NULL as allow_forking, NULL as topics, NULL as visibility,
    NULL as forks, NULL as open_issues, NULL as watchers,
    NULL as svn_url, NULL as has_projects, NULL as has_downloads,
    NULL as has_discussions, NULL as mirror_url, NULL as license_name,
    NULL as is_template, NULL as web_commit_signoff_required
FROM gitee_projects_t_backup_20260810;

SELECT 'Gitee数据迁移完成' as result;

-- 迁移GitCode数据
INSERT INTO unified_projects_t (
    p_id, platform_type, id, name, full_name, type, html_url, description,
    private_flag, owner_name, fork_flag, created_at, updated_at, pushed_at,
    clone_url, code_size, stargazers_count, watchers_count, language,
    forks_count, open_issues_count, license,
    default_branch, owner_avatar_url, owner_type, owner_id, owner_html_url,
    ssh_url, home_page, has_wiki, has_pages,
    open_ai_remark, open_ai_recommend_remark, question_info,
    prompt, integrated_state, contributors,
    dependent_repositories, dependent_packages, record_desc, data_type,
    ai_description, latest_release_tag_name, latest_release_published_at, last_updated_date, openharmony_version,
    -- GitHub/Gitee特有字段
    git_url, size, has_issues, archived, disabled, allow_forking, topics, visibility,
    forks, open_issues, watchers, svn_url, has_projects, has_downloads,
    has_discussions, mirror_url, license_name, is_template, web_commit_signoff_required
)
SELECT
    p_id, platform_type, id, name, full_name, type, html_url, description,
    private_flag, owner_name, fork_flag, created_at, updated_at, pushed_at,
    clone_url, code_size, stargazers_count, watchers_count, language,
    forks_count, open_issues_count, license,
    default_branch, owner_avatar_url, owner_type, owner_id, owner_html_url,
    ssh_url, home_page, has_wiki, has_pages,
    open_ai_remark, open_ai_recommend_remark, question_info,
    prompt, integrated_state, contributors,
    dependent_repositories, dependent_packages, record_desc, 
    CASE WHEN data_type IS NULL THEN 1 ELSE data_type END as data_type,
    ai_description, latest_release_tag_name, latest_release_published_at, last_updated_date, openharmony_version,
    -- GitHub/Gitee特有字段设为NULL
    NULL as git_url, NULL as size, NULL as has_issues, NULL as archived,
    NULL as disabled, NULL as allow_forking, NULL as topics, NULL as visibility,
    NULL as forks, NULL as open_issues, NULL as watchers,
    NULL as svn_url, NULL as has_projects, NULL as has_downloads,
    NULL as has_discussions, NULL as mirror_url, NULL as license_name,
    NULL as is_template, NULL as web_commit_signoff_required
FROM gitcode_projects_t_backup_20260810;

SELECT 'GitCode数据迁移完成' as result;

-- ==================================================================
-- 第四步：创建兼容性视图（替换原表）
-- ==================================================================

-- GitHub兼容性视图
CREATE VIEW github_projects_t AS 
SELECT * FROM unified_projects_t WHERE platform_type = 1;

-- Gitee兼容性视图
CREATE VIEW gitee_projects_t AS 
SELECT * FROM unified_projects_t WHERE platform_type = 2;

-- GitCode兼容性视图
CREATE VIEW gitcode_projects_t AS 
SELECT * FROM unified_projects_t WHERE platform_type = 3;

SELECT '原表兼容性视图创建成功！' as result;

-- ==================================================================
-- 第五步：验证查询
-- ==================================================================

-- 数据完整性验证
SELECT 
    '数据迁移统计' as statistic,
    COUNT(*) as total_records,
    SUM(CASE WHEN platform_type = 1 THEN 1 ELSE 0 END) as github_count,
    SUM(CASE WHEN platform_type = 2 THEN 1 ELSE 0 END) as gitee_count,
    SUM(CASE WHEN platform_type = 3 THEN 1 ELSE 0 END) as gitcode_count
FROM unified_projects_t;

-- 视图功能验证
SELECT 
    '视图功能验证' as statistic,
    (SELECT COUNT(*) FROM github_projects_t) as github_view_count,
    (SELECT COUNT(*) FROM gitee_projects_t) as gitee_view_count,
    (SELECT COUNT(*) FROM gitcode_projects_t) as gitcode_view_count;

-- 备份表数据验证
SELECT 
    '备份表数据验证' as statistic,
    (SELECT COUNT(*) FROM github_projects_t_backup_20260810) as github_backup_count,
    (SELECT COUNT(*) FROM gitee_projects_t_backup_20260810) as gitee_backup_count,
    (SELECT COUNT(*) FROM gitcode_projects_t_backup_20260810) as gitcode_backup_count;
