-- create table 
CREATE TABLE oss-evaluate-summary-history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id int NOT NULL,
    date DATE NOT NULL,
    function_score DOUBLE NOT NULL,
    quality_score DOUBLE NOT NULL,
    ecology_score DOUBLE NOT NULL,
    innovation_score DOUBLE NOT NULL,
    UNIQUE(project_id, date)
);