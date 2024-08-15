import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'BenchmarkIndex',
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      primaryKey: true,
    },
    techStack: {
      type: DataTypes.STRING(128),
    },
    indexName: {
      type: DataTypes.STRING(128),
    },
    displayName: {
      type: DataTypes.STRING(256),
    },
    order: {
      type: DataTypes.INTEGER,
    },
    unit: {
      type: DataTypes.STRING(128),
    },
    category: {
      type: DataTypes.STRING(256),
    },
  },
  {
    tableName: 'benchmark_index',
    underscored: true,
    timestamps: false,
  },
);
