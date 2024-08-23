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