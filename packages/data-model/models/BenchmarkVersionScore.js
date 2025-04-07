import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'BenchmarkVersionScore',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: DataTypes.BIGINT,
    },
    version: {
      type: DataTypes.STRING(128),
    },
    score: {
      type: DataTypes.FLOAT,
    },
    techStack: {
      type: DataTypes.STRING(128),
    },
    isPublish: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
    },
    envInfo: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'benchmark_version_score',
    underscored: true,
    timestamps: false,
  },
);
