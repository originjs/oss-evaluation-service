-- create table trend_history
CREATE TABLE trend_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    data_type INT NOT NULL DEFAULT 0,
    increased_value DOUBLE NOT NULL DEFAULT -1,
    total_value DOUBLE NOT NULL DEFAULT -1,
    date_type INT NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    UNIQUE(project_id, data_type, date_type, date)
);