import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'Benchmark',
  {
    projectId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    projectName: {
      type: DataTypes.STRING,
    },
    benchmark: {
      type: DataTypes.STRING,
    },
    techStack: {
      type: DataTypes.STRING,
    },
    score: {
      type: DataTypes.INTEGER,
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
