-- create table github_projects_history to record the history information
CREATE TABLE github_projects_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    date DATE NOT NULL,
    contributors INT NOT NULL,
    UNIQUE(project_id, date)
);
-- github_projects_history
alter table github_projects_history
    alter column contributors set default (-1);
alter table github_projects_history
    add stars int default -1 not null;

ALTER TABLE github_projects_history
    MODIFY COLUMN contributors INT NULL;

ALTER TABLE github_projects_history
    MODIFY COLUMN stars INT NULL;

-- create table oss_evaluate_summary_history to record the history evaluate score
CREATE TABLE oss_evaluate_summary_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id int NOT NULL,
    date DATE NOT NULL,
    function_score DOUBLE NOT NULL,
    quality_score DOUBLE NOT NULL,
    ecology_score DOUBLE NOT NULL,
    innovation_score DOUBLE NOT NULL,
    UNIQUE(project_id, date)
);
-- create table trend_history
CREATE TABLE trend_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    data_type INT NOT NULL DEFAULT 0 COMMENT '1 对应 star数,2 对应 contributor数,
    3 对应 生态评分,4 对应 质量评分,5 对应 下载量',
    increased_value DOUBLE NOT NULL DEFAULT -1,
    total_value DOUBLE NOT NULL DEFAULT -1,
    date_type INT NOT NULL DEFAULT 0 COMMENT '1 对应 年度数据, 2 对应 月度数据',
    date DATE NOT NULL,
    UNIQUE(project_id, data_type, date_type, date)
);
-- trend_history
ALTER TABLE trend_history
    MODIFY COLUMN increased_value DOUBLE NULL;

ALTER TABLE trend_history
    MODIFY COLUMN total_value DOUBLE NULL;