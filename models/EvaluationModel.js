import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'EvaluationModel',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
    dimension: {
      type: DataTypes.STRING,
    },
    table: {
      type: DataTypes.STRING,
    },
    field: {
      type: DataTypes.STRING,
    },
    weight: {
      type: DataTypes.DOUBLE,
    },
    threshold: {
      type: DataTypes.DOUBLE,
    },
    type: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'evaluation_model_config',
    underscored: true,
    timestamps: false,
  },
);
