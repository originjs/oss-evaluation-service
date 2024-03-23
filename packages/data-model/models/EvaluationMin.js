import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'EvaluationMin',
  {
    projectId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    functionScore: {
      type: DataTypes.DOUBLE,
    },
    qualityScore: {
      type: DataTypes.DOUBLE,
    },
    performanceScore: {
      type: DataTypes.DOUBLE,
    },
    ecologyScore: {
      type: DataTypes.DOUBLE,
    },
    innovationScore: {
      type: DataTypes.DOUBLE,
    },
    scorecardScore: {
      type: DataTypes.DOUBLE,
    },
    criticalityScore: {
      type: DataTypes.DOUBLE,
    },
    openrank: {
      type: DataTypes.DOUBLE,
    },
  },
  {
    tableName: 'oss_evaluation_summary',
    underscored: true,
    createdAt: false,
    updatedAt: 'evaluate_time',
  },
);
