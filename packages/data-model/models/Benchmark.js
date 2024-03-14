import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'Benchmark',
  {
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    projectName: {
      type: DataTypes.STRING,
    },
    displayName: {
      type: DataTypes.STRING(256),
    },
    indexName: {
      type: DataTypes.STRING(256),
    },
    benchmark: {
      type: DataTypes.STRING,
    },
    techStack: {
      type: DataTypes.STRING,
    },
    rawValue: {
      type: DataTypes.FLOAT,
    },
    content: {
      type: DataTypes.JSON,
    },
    patchId: {
      type: DataTypes.STRING,
    },
    platform: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'benchmark',
    underscored: true,
    timestamps: false,
  },
);
