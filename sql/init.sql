-- ============================================================
-- OSS Evaluation Service — Full Schema (MySQL 8+)
-- Generated from 45 Sequelize models + incremental SQL
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `oss-eval` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `oss-eval-inner` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `oss-eval`;


DROP TABLE IF EXISTS `alternative_projects`;
CREATE TABLE `alternative_projects` (
  `p_id` VARCHAR(32) NOT NULL,
  `full_name` VARCHAR(255) NULL,
  `alternative_id` VARCHAR(32) NULL,
  `alternative_name` VARCHAR(255) NULL,
  `alternative_url` VARCHAR(255) NULL,
  `distance` FLOAT NULL,
  `source` VARCHAR(255) NULL,
  `approved` TINYINT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `benchmark`;
CREATE TABLE `benchmark` (
  `p_id` VARCHAR(32) NULL,
  `project_name` VARCHAR(255) NULL,
  `display_name` VARCHAR(256) NULL,
  `benchmark` VARCHAR(255) NULL,
  `tech_stack` VARCHAR(255) NULL,
  `raw_value` FLOAT NULL,
  `content` JSON NULL,
  `patch_id` VARCHAR(255) NULL,
  `platform` VARCHAR(255) NULL,
  `b_id` INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `benchmark_index`;
CREATE TABLE `benchmark_index` (
  `id` BIGINT NOT NULL,
  `tech_stack` VARCHAR(128) NULL,
  `index_name` VARCHAR(128) NULL,
  `display_name` VARCHAR(256) NULL,
  `order` INT NULL,
  `unit` VARCHAR(128) NULL,
  `category` VARCHAR(256) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `benchmark_tech_stacks`;
CREATE TABLE `benchmark_tech_stacks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tech_stack` VARCHAR(255) NOT NULL,
  `approved` TINYINT NOT NULL DEFAULT 1 COMMENT '0:不展示 1:展示',
  `description` VARCHAR(1024) NULL,
  `category` INT NULL,
  `subcategory` VARCHAR(128) NULL,
  `order_num` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `benchmark_version_score`;
CREATE TABLE `benchmark_version_score` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `version` VARCHAR(128) NULL,
  `score` FLOAT NULL,
  `tech_stack` VARCHAR(128) NULL,
  `is_publish` TINYINT NULL DEFAULT 0,
  `description` TEXT NULL,
  `env_info` TEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cncf_document_score`;
CREATE TABLE `cncf_document_score` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NOT NULL,
  `repo_url` VARCHAR(255) NOT NULL,
  `has_readme` TINYINT(1) NULL,
  `has_changelog` TINYINT(1) NULL,
  `has_website` TINYINT(1) NULL,
  `has_contributing` TINYINT(1) NULL,
  `document_score` DOUBLE NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cncf_document_score_only`;
CREATE TABLE `cncf_document_score_only` (
  `p_id` VARCHAR(32) NOT NULL,
  `document_score` DOUBLE NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`p_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `compass_activity_detail`;
CREATE TABLE `compass_activity_detail` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NOT NULL,
  `repo_url` VARCHAR(255) NOT NULL,
  `activity_score` DOUBLE NULL,
  `closed_issues_count` INT NULL,
  `code_review_count` INT NULL,
  `comment_frequency` DOUBLE NULL,
  `commit_frequency` DOUBLE NULL,
  `contributor_count` INT NULL,
  `org_count` INT NULL,
  `recent_releases_count` INT NULL,
  `updated_issues_count` INT NULL,
  `grimoire_creation_date` DATETIME NULL,
  `has_compass_metric` INT NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `criticality_score`;
CREATE TABLE `criticality_score` (
  `p_id` VARCHAR(32) NOT NULL,
  `project_name` VARCHAR(255) NULL,
  `repo_url` VARCHAR(255) NULL,
  `score` FLOAT NULL,
  `collection_date` VARCHAR(255) NULL,
  PRIMARY KEY (`p_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `evaluation_model_config`;
CREATE TABLE `evaluation_model_config` (
  `id` BIGINT NOT NULL,
  `dimension` VARCHAR(255) NULL,
  `tech_stack` VARCHAR(255) NULL,
  `field` VARCHAR(255) NULL,
  `weight` DOUBLE NULL,
  `median` DOUBLE NULL,
  `p10` DOUBLE NULL,
  `is_desc` TINYINT(1) NULL,
  `threshold` DOUBLE NULL,
  `default_value` DOUBLE NULL,
  `type` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gitcode_projects_t`;
CREATE TABLE `gitcode_projects_t` (
  `platform_type` INT NOT NULL DEFAULT 3,
  `id` INT NOT NULL,
  `p_id` VARCHAR(32) AS (CONCAT(platform_type, '#', id)) STORED,
  `name` VARCHAR(512) NULL,
  `full_name` VARCHAR(512) NULL,
  `html_url` VARCHAR(512) NULL,
  `description` VARCHAR(512) NULL,
  `private_flag` VARCHAR(10) NULL,
  `owner_name` VARCHAR(512) NULL,
  `fork_flag` VARCHAR(10) NULL,
  `created_at` VARCHAR(512) NULL,
  `updated_at` VARCHAR(512) NULL,
  `pushed_at` VARCHAR(512) NULL,
  `git_url` VARCHAR(512) NULL,
  `clone_url` VARCHAR(512) NULL,
  `size` INT NULL,
  `code_size` INT NULL,
  `stargazers_count` INT NULL,
  `watchers_count` INT NULL,
  `language` VARCHAR(512) NULL,
  `has_issues` VARCHAR(10) NULL,
  `forks_count` INT NULL,
  `archived` VARCHAR(10) NULL,
  `disabled` VARCHAR(10) NULL,
  `open_issues_count` INT NULL,
  `license` VARCHAR(512) NULL,
  `allow_forking` VARCHAR(255) NULL,
  `topics` VARCHAR(512) NULL,
  `visibility` VARCHAR(255) NULL,
  `forks` INT NULL,
  `open_issues` INT NULL,
  `watchers` INT NULL,
  `default_branch` VARCHAR(512) NULL,
  `owner_avatar_url` VARCHAR(512) NULL,
  `owner_type` VARCHAR(255) NULL,
  `owner_id` VARCHAR(512) NULL,
  `owner_html_url` VARCHAR(512) NULL,
  `ssh_url` VARCHAR(512) NULL,
  `svn_url` VARCHAR(512) NULL,
  `home_page` VARCHAR(512) NULL,
  `has_projects` VARCHAR(10) NULL,
  `has_downloads` VARCHAR(10) NULL,
  `has_wiki` VARCHAR(10) NULL,
  `has_pages` VARCHAR(10) NULL,
  `has_discussions` VARCHAR(10) NULL,
  `mirror_url` VARCHAR(512) NULL,
  `license_name` VARCHAR(512) NULL,
  `is_template` VARCHAR(255) NULL,
  `web_commit_signoff_required` VARCHAR(255) NULL,
  `open_ai_remark` VARCHAR(500) NULL,
  `open_ai_recommend_remark` VARCHAR(500) NULL,
  `question_info` VARCHAR(1000) NULL,
  `prompt` TEXT NULL,
  `integrated_state` INT NULL,
  `contributors` INT NULL,
  `dependent_repositories` BIGINT NULL,
  `dependent_packages` BIGINT NULL,
  `record_desc` VARCHAR(255) NULL,
  `data_type` TINYINT NULL,
  `ai_description` JSON NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gitee_projects_t`;
CREATE TABLE `gitee_projects_t` (
  `platform_type` INT NOT NULL DEFAULT 2,
  `id` INT NOT NULL,
  `p_id` VARCHAR(32) AS (CONCAT(platform_type, '#', id)) STORED,
  `name` VARCHAR(512) NULL,
  `full_name` VARCHAR(512) NULL,
  `html_url` VARCHAR(512) NULL,
  `description` VARCHAR(512) NULL,
  `private_flag` VARCHAR(10) NULL,
  `owner_name` VARCHAR(512) NULL,
  `fork_flag` VARCHAR(10) NULL,
  `created_at` VARCHAR(512) NULL,
  `updated_at` VARCHAR(512) NULL,
  `pushed_at` VARCHAR(512) NULL,
  `git_url` VARCHAR(512) NULL,
  `clone_url` VARCHAR(512) NULL,
  `size` INT NULL,
  `code_size` INT NULL,
  `stargazers_count` INT NULL,
  `watchers_count` INT NULL,
  `language` VARCHAR(512) NULL,
  `has_issues` VARCHAR(10) NULL,
  `forks_count` INT NULL,
  `archived` VARCHAR(10) NULL,
  `disabled` VARCHAR(10) NULL,
  `open_issues_count` INT NULL,
  `license` VARCHAR(512) NULL,
  `allow_forking` VARCHAR(255) NULL,
  `topics` VARCHAR(512) NULL,
  `visibility` VARCHAR(255) NULL,
  `forks` INT NULL,
  `open_issues` INT NULL,
  `watchers` INT NULL,
  `default_branch` VARCHAR(512) NULL,
  `owner_avatar_url` VARCHAR(512) NULL,
  `owner_type` VARCHAR(255) NULL,
  `owner_id` VARCHAR(512) NULL,
  `owner_html_url` VARCHAR(512) NULL,
  `ssh_url` VARCHAR(512) NULL,
  `svn_url` VARCHAR(512) NULL,
  `home_page` VARCHAR(512) NULL,
  `has_projects` VARCHAR(10) NULL,
  `has_downloads` VARCHAR(10) NULL,
  `has_wiki` VARCHAR(10) NULL,
  `has_pages` VARCHAR(10) NULL,
  `has_discussions` VARCHAR(10) NULL,
  `mirror_url` VARCHAR(512) NULL,
  `license_name` VARCHAR(512) NULL,
  `is_template` VARCHAR(255) NULL,
  `web_commit_signoff_required` VARCHAR(255) NULL,
  `open_ai_remark` VARCHAR(500) NULL,
  `open_ai_recommend_remark` VARCHAR(500) NULL,
  `question_info` VARCHAR(1000) NULL,
  `prompt` TEXT NULL,
  `integrated_state` INT NULL,
  `contributors` INT NULL,
  `dependent_repositories` BIGINT NULL,
  `dependent_packages` BIGINT NULL,
  `record_desc` VARCHAR(255) NULL,
  `data_type` TINYINT NULL,
  `ai_description` JSON NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `github_projects`;
CREATE TABLE `github_projects` (
  `id` INT NOT NULL,
  `name` VARCHAR(512) NULL,
  `full_name` VARCHAR(512) NULL,
  `html_url` VARCHAR(512) NULL,
  `description` VARCHAR(512) NULL,
  `private_flag` VARCHAR(10) NULL,
  `owner_name` VARCHAR(512) NULL,
  `fork_flag` VARCHAR(10) NULL,
  `created_at` VARCHAR(512) NULL,
  `updated_at` VARCHAR(512) NULL,
  `pushed_at` VARCHAR(512) NULL,
  `git_url` VARCHAR(512) NULL,
  `clone_url` VARCHAR(512) NULL,
  `size` INT NULL,
  `code_size` INT NULL,
  `stargazers_count` INT NULL,
  `watchers_count` INT NULL,
  `language` VARCHAR(512) NULL,
  `has_issues` VARCHAR(10) NULL,
  `forks_count` INT NULL,
  `archived` VARCHAR(10) NULL,
  `disabled` VARCHAR(10) NULL,
  `open_issues_count` INT NULL,
  `license` VARCHAR(512) NULL,
  `allow_forking` VARCHAR(255) NULL,
  `topics` VARCHAR(512) NULL,
  `visibility` VARCHAR(255) NULL,
  `forks` INT NULL,
  `open_issues` INT NULL,
  `watchers` INT NULL,
  `default_branch` VARCHAR(512) NULL,
  `owner_avatar_url` VARCHAR(512) NULL,
  `owner_type` VARCHAR(255) NULL,
  `owner_id` VARCHAR(512) NULL,
  `owner_html_url` VARCHAR(512) NULL,
  `ssh_url` VARCHAR(512) NULL,
  `svn_url` VARCHAR(512) NULL,
  `home_page` VARCHAR(512) NULL,
  `has_projects` VARCHAR(10) NULL,
  `has_downloads` VARCHAR(10) NULL,
  `has_wiki` VARCHAR(10) NULL,
  `has_pages` VARCHAR(10) NULL,
  `has_discussions` VARCHAR(10) NULL,
  `mirror_url` VARCHAR(512) NULL,
  `license_name` VARCHAR(512) NULL,
  `is_template` VARCHAR(255) NULL,
  `web_commit_signoff_required` VARCHAR(255) NULL,
  `open_ai_remark` VARCHAR(500) NULL,
  `open_ai_recommend_remark` VARCHAR(500) NULL,
  `question_info` VARCHAR(1000) NULL,
  `prompt` TEXT NULL,
  `integrated_state` INT NULL,
  `contributors` INT NULL,
  `dependent_repositories` BIGINT NULL,
  `dependent_packages` BIGINT NULL,
  `record_desc` VARCHAR(255) NULL,
  `ai_description` JSON NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `github_projects_dependencies`;
CREATE TABLE `github_projects_dependencies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `full_name` VARCHAR(100) NULL,
  `owner_name` VARCHAR(512) NULL,
  `name` VARCHAR(512) NULL,
  `language` VARCHAR(10) NULL,
  `owner_type` VARCHAR(100) NULL,
  `dependent_p_id` VARCHAR(32) NULL,
  `dependent_full_name` VARCHAR(100) NULL,
  `dependent_owner_name` VARCHAR(512) NULL,
  `dependent_name` VARCHAR(512) NULL,
  `dependent_requirements` VARCHAR(100) NULL,
  `dependent_html_url` VARCHAR(512) NULL,
  `dependent_owner_type` VARCHAR(100) NULL,
  `last_updated_date` DATETIME NULL,
  `deleted` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `github_projects_history`;
CREATE TABLE `github_projects_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `date` DATE NULL,
  `contributors` INT NULL,
  `stars` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `github_projects_rank`;
CREATE TABLE `github_projects_rank` (
  `id` INT NOT NULL,
  `full_name` VARCHAR(128) NOT NULL DEFAULT '',
  `home_url` VARCHAR(128) NOT NULL DEFAULT '',
  `order_num` INT NOT NULL DEFAULT 0,
  `value` INT NOT NULL DEFAULT -1,
  `type` VARCHAR(16) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `github_projects_stargazers_trend`;
CREATE TABLE `github_projects_stargazers_trend` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(512) NOT NULL,
  `full_name` VARCHAR(512) NOT NULL,
  `html_url` VARCHAR(512) NOT NULL,
  `stargazers` INT NOT NULL,
  `date` DATETIME NOT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `github_projects_t`;
CREATE TABLE `github_projects_t` (
  `platform_type` INT NOT NULL DEFAULT 1,
  `id` INT NOT NULL,
  `p_id` VARCHAR(32) AS (CONCAT(platform_type, '#', id)) STORED,
  `name` VARCHAR(512) NULL,
  `full_name` VARCHAR(512) NULL,
  `html_url` VARCHAR(512) NULL,
  `description` VARCHAR(512) NULL,
  `private_flag` VARCHAR(10) NULL,
  `owner_name` VARCHAR(512) NULL,
  `fork_flag` VARCHAR(10) NULL,
  `created_at` VARCHAR(512) NULL,
  `updated_at` VARCHAR(512) NULL,
  `pushed_at` VARCHAR(512) NULL,
  `git_url` VARCHAR(512) NULL,
  `clone_url` VARCHAR(512) NULL,
  `size` INT NULL,
  `code_size` INT NULL,
  `stargazers_count` INT NULL,
  `watchers_count` INT NULL,
  `language` VARCHAR(512) NULL,
  `has_issues` VARCHAR(10) NULL,
  `forks_count` INT NULL,
  `archived` VARCHAR(10) NULL,
  `disabled` VARCHAR(10) NULL,
  `open_issues_count` INT NULL,
  `license` VARCHAR(512) NULL,
  `allow_forking` VARCHAR(255) NULL,
  `topics` VARCHAR(512) NULL,
  `visibility` VARCHAR(255) NULL,
  `forks` INT NULL,
  `open_issues` INT NULL,
  `watchers` INT NULL,
  `default_branch` VARCHAR(512) NULL,
  `owner_avatar_url` VARCHAR(512) NULL,
  `owner_type` VARCHAR(255) NULL,
  `owner_id` VARCHAR(512) NULL,
  `owner_html_url` VARCHAR(512) NULL,
  `ssh_url` VARCHAR(512) NULL,
  `svn_url` VARCHAR(512) NULL,
  `home_page` VARCHAR(512) NULL,
  `has_projects` VARCHAR(10) NULL,
  `has_downloads` VARCHAR(10) NULL,
  `has_wiki` VARCHAR(10) NULL,
  `has_pages` VARCHAR(10) NULL,
  `has_discussions` VARCHAR(10) NULL,
  `mirror_url` VARCHAR(512) NULL,
  `license_name` VARCHAR(512) NULL,
  `is_template` VARCHAR(255) NULL,
  `web_commit_signoff_required` VARCHAR(255) NULL,
  `open_ai_remark` VARCHAR(500) NULL,
  `open_ai_recommend_remark` VARCHAR(500) NULL,
  `question_info` VARCHAR(1000) NULL,
  `prompt` TEXT NULL,
  `integrated_state` INT NULL,
  `contributors` INT NULL,
  `dependent_repositories` BIGINT NULL,
  `dependent_packages` BIGINT NULL,
  `record_desc` VARCHAR(255) NULL,
  `data_type` TINYINT NULL,
  `ai_description` JSON NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `oss-eval-inner`;

DROP TABLE IF EXISTS `landscape_projects`;
CREATE TABLE `landscape_projects` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `landscspe` VARCHAR(255) NULL,
  `category` VARCHAR(255) NULL,
  `subcategory` VARCHAR(255) NULL,
  `name` VARCHAR(255) NULL,
  `describtion` VARCHAR(255) NULL,
  `html_url` VARCHAR(255) NULL,
  `github_id` VARCHAR(255) NULL,
  `lable` VARCHAR(255) NULL,
  `is_valid` TINYINT NOT NULL DEFAULT 1,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `oss-eval`;

DROP TABLE IF EXISTS `new_project_apply`;
CREATE TABLE `new_project_apply` (
  `id` VARCHAR(256) NOT NULL,
  `repo_url` VARCHAR(255) NOT NULL,
  `comment` VARCHAR(255) NULL,
  `username` VARCHAR(255) NULL,
  `bu_name` VARCHAR(255) NULL,
  `is_bu_owner` TINYINT(1) NOT NULL DEFAULT 0,
  `alternative_p_id` VARCHAR(255) NULL,
  `applicant_email` VARCHAR(255) NULL,
  `type` INT NOT NULL,
  `benchmark_name` VARCHAR(255) NULL,
  `expand_field1` VARCHAR(255) NULL,
  `tech_stack` VARCHAR(255) NOT NULL DEFAULT '',
  `sub_tech_stack` VARCHAR(255) NOT NULL DEFAULT '',
  `employee_number` VARCHAR(32) NOT NULL DEFAULT '',
  `created_at` DATETIME NOT NULL,
  `state` TINYINT NOT NULL DEFAULT 1,
  `integration_finished_time` DATETIME NULL,
  `filename` VARCHAR(256) NOT NULL DEFAULT '',
  `env_info` VARCHAR(512) NOT NULL DEFAULT '',
  `deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `reason` VARCHAR(1000) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `opendigger_info`;
CREATE TABLE `opendigger_info` (
  `p_id` VARCHAR(32) NOT NULL,
  `openrank` DOUBLE NULL,
  `openrank_date` VARCHAR(255) NULL,
  `bus_factor` DOUBLE NULL,
  `bus_factor_date` VARCHAR(255) NULL,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`p_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `oss_evaluate_summary_history`;
CREATE TABLE `oss_evaluate_summary_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `date` DATE NULL,
  `function_score` DOUBLE NULL,
  `quality_score` DOUBLE NULL,
  `ecology_score` DOUBLE NULL,
  `innovation_score` DOUBLE NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `oss_evaluation_summary`;
CREATE TABLE `oss_evaluation_summary` (
  `p_id` VARCHAR(32) NOT NULL,
  `project_name` VARCHAR(255) NULL,
  `tech_stack` VARCHAR(255) NULL,
  `function_value` DOUBLE NULL,
  `function_score` DOUBLE NULL,
  `quality_value` DOUBLE NULL,
  `quality_score` DOUBLE NULL,
  `performance_value` DOUBLE NULL,
  `performance_score` DOUBLE NULL,
  `ecology_value` DOUBLE NULL,
  `ecology_score` DOUBLE NULL,
  `innovation_value` DOUBLE NULL,
  `innovation_score` DOUBLE NULL,
  `evaluate_time` DATETIME NULL,
  `satisfaction` DOUBLE NULL,
  `doc_best_practice` DOUBLE NULL,
  `scorecard_score` DOUBLE NULL,
  `criticality_score` DOUBLE NULL,
  `openrank` DOUBLE NULL,
  `contributor_count` INT NULL,
  `closed_issues_count` INT NULL,
  `code_review_count` INT NULL,
  `comment_frequency` DOUBLE NULL,
  `commit_frequency` DOUBLE NULL,
  `org_count` INT NULL,
  `recent_releases_count` INT NULL,
  `updated_issues_count` INT NULL,
  `bus_factor` INT NULL,
  `stargazers_count` INT NULL,
  `forks_count` INT NULL,
  `code_size` INT NULL,
  `npm_downloads` INT NULL,
  `sonarcloud_score` INT NULL,
  `create_time` DOUBLE NULL,
  `update_time` DOUBLE NULL,
  `market_share` DOUBLE NULL,
  `star_rate` DOUBLE NULL,
  `download_rate` DOUBLE NULL,
  `creator_orgs` DOUBLE NULL,
  `creator_countries` DOUBLE NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`p_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `oss_github_fork`;
CREATE TABLE `oss_github_fork` (
  `id` INT NOT NULL,
  `upstream_name` VARCHAR(512) NULL,
  `full_name` VARCHAR(512) NULL,
  `p_id` VARCHAR(32) NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `oss_gitlab_fork`;
CREATE TABLE `oss_gitlab_fork` (
  `id` INT NOT NULL,
  `p_id` VARCHAR(32) NULL,
  `p_full_name` VARCHAR(512) NULL,
  `full_name` VARCHAR(512) NULL,
  `full_path` VARCHAR(512) NULL,
  `name` VARCHAR(512) NULL,
  `has_sonar_pipeline` TINYINT(1) NOT NULL DEFAULT 0,
  `default_branch` VARCHAR(128) NOT NULL DEFAULT '',
  `namespace_id` INT NULL,
  `namespace_name` VARCHAR(512) NULL,
  `namespace_path` VARCHAR(512) NULL,
  `ssh_clone_url` VARCHAR(512) NULL,
  `http_clone_url` VARCHAR(512) NULL,
  `web_url` VARCHAR(512) NULL,
  `updated_primary_branch` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ossinsight_creators_countries`;
CREATE TABLE `ossinsight_creators_countries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `country_code` VARCHAR(10) NULL,
  `creators_num` BIGINT NULL,
  `percentage` DECIMAL(10,2) NULL,
  `type` INT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `ossinsight_creators_countries_p_id_type_index` (`p_id`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ossinsight_creators_organizations`;
CREATE TABLE `ossinsight_creators_organizations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `org_name` VARCHAR(100) NULL,
  `creators_num` BIGINT NULL,
  `percentage` DECIMAL(10,2) NULL,
  `type` INT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `ossinsight_creators_organizations_p_id_type_index` (`p_id`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ossinsight_pull_request_creators_countries`;
CREATE TABLE `ossinsight_pull_request_creators_countries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL UNIQUE,
  `country_code` VARCHAR(10) NULL,
  `pull_request_creators` BIGINT NULL,
  `percentage` DECIMAL(10,2) NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `package_download_count`;
CREATE TABLE `package_download_count` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `package_name` VARCHAR(200) NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `week` VARCHAR(50) NULL,
  `downloads` INT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `package_size_detail`;
CREATE TABLE `package_size_detail` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `package_name` VARCHAR(255) NULL,
  `version` VARCHAR(255) NULL,
  `clone_url` VARCHAR(255) NULL,
  `size` INT NULL,
  `gzip_size` INT NULL,
  `dependency_count` INT NULL,
  `create_at` DATETIME NULL,
  `update_at` DATETIME NULL,
  `reason` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `project_packages`;
CREATE TABLE `project_packages` (
  `p_id` VARCHAR(32) NOT NULL,
  `project_name` VARCHAR(255) NULL,
  `package` VARCHAR(255) NULL,
  `main_package` TINYINT(1) NULL,
  `main_package_fresh_type` VARCHAR(128) NULL,
  PRIMARY KEY (`p_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `oss-eval-inner`;

DROP TABLE IF EXISTS `project_stack_from_ai`;
CREATE TABLE `project_stack_from_ai` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `landscape` VARCHAR(255) NULL,
  `category` VARCHAR(255) NULL,
  `subcategory` VARCHAR(255) NULL,
  `name` VARCHAR(255) NULL,
  `description` VARCHAR(255) NULL,
  `reasons` VARCHAR(255) NULL,
  `html_url` VARCHAR(255) NULL,
  `github_id` VARCHAR(255) NULL,
  `label` VARCHAR(255) NULL,
  `language` VARCHAR(255) NULL,
  `is_valid` TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `oss-eval`;

DROP TABLE IF EXISTS `project_tech_stack`;
CREATE TABLE `project_tech_stack` (
  `p_id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(255) NULL,
  `full_name` VARCHAR(255) NULL,
  `html_url` VARCHAR(255) NULL,
  `category` VARCHAR(255) NULL,
  `subcategory` VARCHAR(255) NULL,
  `platform` VARCHAR(255) NULL,
  `archived` VARCHAR(255) NULL,
  `radar_quadrant` INT NULL,
  `radar_ring` INT NULL,
  `radar_moved` INT NULL,
  PRIMARY KEY (`p_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `schedule_task_monitor`;
CREATE TABLE `schedule_task_monitor` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `task_id` VARCHAR(255) NULL,
  `task_name` VARCHAR(255) NULL,
  `task_desc` VARCHAR(255) NULL,
  `status` INT NULL,
  `messaged` INT NULL,
  `start_time` TIME NULL,
  `end_time` TIME NULL,
  `duration` INT NULL,
  `cron` VARCHAR(255) NULL,
  `ip` VARCHAR(255) NULL,
  `task_exception` VARCHAR(255) NULL,
  `is_valid` INT NULL,
  `last_updated_date` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `scorecard_complementery`;
CREATE TABLE `scorecard_complementery` (
  `p_id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(255) NULL,
  `html_url` VARCHAR(255) NULL,
  `category` VARCHAR(255) NULL,
  `platform` VARCHAR(255) NULL,
  `archived` VARCHAR(255) NULL,
  PRIMARY KEY (`p_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `scorecard_info`;
CREATE TABLE `scorecard_info` (
  `p_id` VARCHAR(32) NOT NULL,
  `repo_name` VARCHAR(255) NULL,
  `collection_date` VARCHAR(255) NULL,
  `score` INT NULL,
  `commit` VARCHAR(255) NULL,
  `code_review` INT NULL,
  `maintained` INT NULL,
  `cii_best_practices` INT NULL,
  `license` INT NULL,
  `signed_releases` INT NULL,
  `packaging` INT NULL,
  `token_permissions` INT NULL,
  `dangerous_workflow` INT NULL,
  `pinned_dependencies` INT NULL,
  `branch_protection` INT NULL,
  `binary_artifacts` INT NULL,
  `fuzzing` INT NULL,
  `security_policy` INT NULL,
  `sast` INT NULL,
  `vulnerabilities` INT NULL,
  `is_local` TINYINT(1) NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`p_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `sonar_cloud_project`;
CREATE TABLE `sonar_cloud_project` (
  `id` INT NOT NULL,
  `p_id` VARCHAR(32) NOT NULL DEFAULT -1,
  `gitlab_project_id` INT NOT NULL DEFAULT -1,
  `fork_p_id` VARCHAR(32) NOT NULL DEFAULT -1,
  `fork_github_full_name` VARCHAR(512) NOT NULL DEFAULT '',
  `github_full_name` VARCHAR(512) NOT NULL DEFAULT '',
  `gitlab_full_name` VARCHAR(512) NOT NULL DEFAULT '',
  `sonar_org` VARCHAR(512) NOT NULL DEFAULT '',
  `sonar_project_key` VARCHAR(512) NOT NULL DEFAULT '',
  `default_branch` VARCHAR(512) NOT NULL DEFAULT '',
  `analysis_date` DATETIME NULL,
  `bugs` INT NOT NULL DEFAULT 0,
  `reliability_rating` VARCHAR(255) NOT NULL DEFAULT '',
  `vulnerabilities` INT NOT NULL DEFAULT 0,
  `security_rating` VARCHAR(255) NOT NULL DEFAULT '',
  `security_hotspots` INT NOT NULL DEFAULT 0,
  `security_hotspots_reviewed` VARCHAR(128) NOT NULL DEFAULT '',
  `security_review_rating` VARCHAR(255) NOT NULL DEFAULT '',
  `code_smells` INT NOT NULL DEFAULT 0,
  `coverage_rating` VARCHAR(255) NOT NULL DEFAULT '',
  `duplicated_lines_density` VARCHAR(255) NOT NULL DEFAULT '',
  `code_lines` INT NOT NULL DEFAULT 0,
  `maintainability_rating` VARCHAR(255) NOT NULL DEFAULT '',
  `all_measures` JSON NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stackoverflow_survey_result`;
CREATE TABLE `stackoverflow_survey_result` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_name` VARCHAR(255) NOT NULL,
  `p_id` VARCHAR(32) NULL,
  `technology_stack` VARCHAR(255) NULL,
  `year` INT NULL,
  `wanted_frequency` INT NULL,
  `admired_frequency` INT NULL,
  `dreaded_frequency` INT NULL,
  `wanted_percent` FLOAT NULL,
  `admired_percent` FLOAT NULL,
  `dreaded_percent` FLOAT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `state_of_js_detail`;
CREATE TABLE `state_of_js_detail` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_name` VARCHAR(255) NOT NULL,
  `p_id` VARCHAR(32) NULL,
  `technology_stack` VARCHAR(255) NULL,
  `year` INT NULL,
  `usage_rank` INT NULL,
  `usage_percentage` FLOAT NULL,
  `awareness_rank` INT NULL,
  `awareness_percentage` FLOAT NULL,
  `interest_rank` INT NULL,
  `interest_percentage` FLOAT NULL,
  `satisfaction_rank` INT NULL,
  `satisfaction_percentage` FLOAT NULL,
  `would_use_question_percentage` FLOAT NULL,
  `would_use_survey_percentage` FLOAT NULL,
  `would_use_count` INT NULL,
  `would_not_use_question_percentage` FLOAT NULL,
  `would_not_use_survey_percentage` FLOAT NULL,
  `would_not_use_count` INT NULL,
  `interested_question_percentage` FLOAT NULL,
  `interested_survey_percentage` FLOAT NULL,
  `interested_count` INT NULL,
  `not_interested_question_percentage` FLOAT NULL,
  `not_interested_survey_percentage` FLOAT NULL,
  `not_interested_count` INT NULL,
  `never_heard_question_percentage` FLOAT NULL,
  `never_heard_survey_percentage` FLOAT NULL,
  `never_heard_count` INT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trend_history`;
CREATE TABLE `trend_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `data_type` INT NULL,
  `increased_value` DOUBLE NULL,
  `total_value` DOUBLE NULL,
  `date_type` INT NULL,
  `date` DATE NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trend_rank_history`;
CREATE TABLE `trend_rank_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `data_type` INT NULL,
  `increased_value` DOUBLE NULL,
  `total_value` DOUBLE NULL,
  `date_type` INT NULL,
  `date` DATE NULL,
  `rank_type` INT NULL,
  `rank_column` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VIEW: view_projects
-- ============================================================
DROP VIEW IF EXISTS `view_projects`;
CREATE VIEW `view_projects` AS
SELECT g.p_id, g.platform_type, g.id, g.name, g.full_name, g.html_url, g.description,
       g.private_flag, g.owner_name, g.fork_flag, g.created_at, g.updated_at, g.pushed_at,
       g.git_url, g.clone_url, g.size, g.stargazers_count, g.watchers_count, g.language,
       g.has_issues, g.forks_count, g.archived, g.disabled, g.open_issues_count,
       g.allow_forking, g.topics, g.visibility, g.forks, g.open_issues, g.watchers,
       g.default_branch, g.owner_avatar_url, g.owner_type, g.owner_id, g.owner_html_url,
       g.ssh_url, g.svn_url, g.home_page, g.has_projects, g.has_downloads,
       g.has_wiki, g.has_pages, g.has_discussions, g.mirror_url, g.license_name,
       g.is_template, g.web_commit_signoff_required,
       g.open_ai_remark, g.open_ai_recommend_remark, g.question_info, g.prompt,
       g.integrated_state, g.contributors, g.dependent_repositories, g.dependent_packages,
       g.record_desc, g.data_type, g.ai_description, g.code_size
FROM github_projects_t g WHERE g.data_type = 1
UNION ALL
SELECT e.p_id, e.platform_type, e.id, e.name, e.full_name, e.html_url, e.description,
       e.private_flag, e.owner_name, e.fork_flag, e.created_at, e.updated_at, e.pushed_at,
       NULL, e.clone_url, NULL, e.stargazers_count, e.watchers_count, e.language,
       e.has_issues, e.forks_count, NULL, NULL, e.open_issues_count,
       NULL, NULL, NULL, NULL, NULL, NULL,
       e.default_branch, e.owner_avatar_url, e.owner_type, e.owner_id, e.owner_html_url,
       e.ssh_url, NULL, e.home_page, NULL, NULL, e.has_wiki, e.has_pages, NULL, NULL, e.license,
       NULL, NULL,
       e.open_ai_remark, e.open_ai_recommend_remark, e.question_info, e.prompt,
       e.integrated_state, e.contributors, e.dependent_repositories, e.dependent_packages,
       e.record_desc, e.data_type, e.ai_description, e.code_size
FROM gitee_projects_t e WHERE e.data_type = 1
UNION ALL
SELECT c.p_id, c.platform_type, c.id, c.name, c.full_name, c.html_url, c.description,
       c.private_flag, c.owner_name, c.fork_flag, c.created_at, c.updated_at, c.pushed_at,
       NULL, c.clone_url, NULL, c.stargazers_count, c.watchers_count, c.language,
       NULL, c.forks_count, NULL, NULL, c.open_issues_count,
       NULL, NULL, NULL, NULL, NULL, NULL,
       c.default_branch, c.owner_avatar_url, c.owner_type, c.owner_id, c.owner_html_url,
       c.ssh_url, NULL, c.home_page, NULL, NULL, c.has_wiki, c.has_pages, NULL, NULL, c.license,
       NULL, NULL,
       c.open_ai_remark, c.open_ai_recommend_remark, c.question_info, c.prompt,
       c.integrated_state, c.contributors, c.dependent_repositories, c.dependent_packages,
       c.record_desc, c.data_type, c.ai_description, c.code_size
FROM gitcode_projects_t c WHERE c.data_type = 1;

DROP TABLE IF EXISTS `criticality_score_20240401`;
CREATE TABLE `criticality_score_20240401` (
  `url` VARCHAR(512) NOT NULL,
  `default_score` DOUBLE NULL,
  `collection_date` DATE NULL,
  PRIMARY KEY (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `oss-eval-inner`;

DROP TABLE IF EXISTS `compass_activity_detail_substitute`;
CREATE TABLE `compass_activity_detail_substitute` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `p_id` VARCHAR(32) NULL,
  `full_name` VARCHAR(255) NULL,
  `commit_frequency` DOUBLE NULL,
  `comment_frequency` DOUBLE NULL,
  `updated_issues_count` INT NULL,
  `closed_issues_count` INT NULL,
  `org_count` INT NULL,
  `contributor_count` INT NULL,
  `recent_releases_count` INT NULL,
  `grimoire_creation_date` DATETIME NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

USE `oss-eval`;

CREATE UNIQUE INDEX `alternative_projects_id_url` ON `alternative_projects` (`p_id`, `alternative_url`);
CREATE INDEX `sonar_cloud_project_p_id_index` ON `sonar_cloud_project` (`p_id`);
CREATE INDEX `state_of_js_detail_p_id_index` ON `state_of_js_detail` (`p_id`);
CREATE INDEX `github_projects_stargazers_trend_p_id_index` ON `github_projects_stargazers_trend` (`p_id`);

SET FOREIGN_KEY_CHECKS = 1;
