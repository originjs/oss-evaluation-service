-- ==================================================================
-- 重构 view_projects 视图
-- ==================================================================

-- 删除旧视图
DROP VIEW IF EXISTS view_projects;

-- 创建新视图
CREATE VIEW view_projects AS
SELECT 
    u.p_id AS p_id,
    u.platform_type AS platform_type,
    u.id AS id,
    u.name AS name,
    u.full_name AS full_name,
    u.type AS type,
    u.html_url AS html_url,
    u.description AS description,
    u.private_flag AS private_flag,
    u.owner_name AS owner_name,
    u.fork_flag AS fork_flag,
    u.created_at AS created_at,
    u.updated_at AS updated_at,
    u.pushed_at AS pushed_at,
    u.git_url AS git_url,
    u.clone_url AS clone_url,
    u.size AS size,
    u.stargazers_count AS stargazers_count,
    u.watchers_count AS watchers_count,
    u.language AS language,
    u.has_issues AS has_issues,
    u.forks_count AS forks_count,
    u.archived AS archived,
    u.disabled AS disabled,
    u.open_issues_count AS open_issues_count,
    u.allow_forking AS allow_forking,
    u.topics AS topics,
    u.visibility AS visibility,
    u.forks AS forks,
    u.open_issues AS open_issues,
    u.watchers AS watchers,
    u.default_branch AS default_branch,
    u.owner_avatar_url AS owner_avatar_url,
    u.owner_type AS owner_type,
    u.owner_id AS owner_id,
    u.owner_html_url AS owner_html_url,
    u.ssh_url AS ssh_url,
    u.svn_url AS svn_url,
    u.home_page AS home_page,
    u.has_projects AS has_projects,
    u.has_downloads AS has_downloads,
    u.has_wiki AS has_wiki,
    u.has_pages AS has_pages,
    u.has_discussions AS has_discussions,
    u.mirror_url AS mirror_url,
    u.is_template AS is_template,
    u.web_commit_signoff_required AS web_commit_signoff_required,
    u.open_ai_remark AS open_ai_remark,
    u.open_ai_recommend_remark AS open_ai_recommend_remark,
    u.question_info AS question_info,
    u.prompt AS prompt,
    u.integrated_state AS integrated_state,
    u.contributors AS contributors,
    u.dependent_repositories AS dependent_repositories,
    u.dependent_packages AS dependent_packages,
    u.last_updated_date AS last_updated_date,
    u.record_desc AS record_desc,
    u.data_type AS data_type,
    u.ai_description AS ai_description,
    IF((c.code_size IS NULL OR c.code_size = 0), u.code_size, c.code_size) AS code_size,
    IF((c.license_name IS NULL OR c.license_name = ''), u.license_name, c.license_name) AS license_name,
    u.latest_release_tag_name AS latest_release_tag_name,
    u.latest_release_published_at AS latest_release_published_at
FROM unified_projects_t u
LEFT JOIN `oss-eval-inner`.clean_source_software c 
ON (u.p_id = c.p_id 
    AND u.p_id <> '' 
    AND c.valid = 1)
WHERE u.data_type = 1;

SELECT 'view_projects视图重构成功！' as result;
