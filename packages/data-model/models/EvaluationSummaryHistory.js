import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'EvaluationSummaryHistory',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pId: {
      type: DataTypes.STRING(32),
    },
    date: {
      type: DataTypes.DATEONLY,
    },
    functionScore: {
      type: DataTypes.DOUBLE,
    },
    qualityScore: {
      type: DataTypes.DOUBLE,
    },
    ecologyScore: {
      type: DataTypes.DOUBLE,
    },
    innovationScore: {
      type: DataTypes.DOUBLE,
    },
  },
  {
    tableName: 'oss_evaluate_summary_history',
    underscored: true,
    timestamps: false,
  },
);
