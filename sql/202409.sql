ALTER TABLE evaluation_model_config
    ADD COLUMN `default_value` double NULL AFTER `threshold`;

-- update trend_history
ALTER TABLE trend_history
    MODIFY COLUMN data_type INT NOT NULL DEFAULT 0 COMMENT '1 对应 star数,2 对应 contributor数,
    3 对应 生态评分,4 对应 质量评分';

ALTER TABLE trend_history
    MODIFY COLUMN date_type INT NOT NULL DEFAULT 0 COMMENT '1 对应 年度数据, 2 对应 月度数据,
    3 对应 周度数据';

-- create table trend_rank_history
CREATE TABLE trend_rank_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    data_type INT NOT NULL DEFAULT 0 COMMENT '1 对应 star数,2 对应 contributor数,
    3 对应 生态评分,4 对应 质量评分',
    increased_value DOUBLE NULL,
    total_value DOUBLE NULL,
    date_type INT NOT NULL DEFAULT 0 COMMENT '1 对应 年度数据, 2 对应 月度数据
    3 对应 周度数据',
    date DATE NOT NULL,
    rank_type INT NOT NULL DEFAULT 0 COMMENT '1 对应 增长量排名, 2 对应 总量排名',
    rank INT NOT NULL DEFAULT 0,
    UNIQUE(data_type, date_type, date, rank_type, project_id)
);