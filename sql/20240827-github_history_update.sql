ALTER TABLE github_projects_history
    MODIFY COLUMN contributors INT NULL;

ALTER TABLE github_projects_history
    MODIFY COLUMN stars INT NULL;