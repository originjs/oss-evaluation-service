-- create table github_projects_history to record the history information
CREATE TABLE github_projects_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    date DATE NOT NULL,
    contributors INT NOT NULL,
    UNIQUE(project_id, date)
);