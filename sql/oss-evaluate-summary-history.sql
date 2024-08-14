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