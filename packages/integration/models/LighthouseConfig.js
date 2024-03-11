import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'LighthouseConfig',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    fieldName: {
      type: DataTypes.STRING,
    },
    median: {
      type: DataTypes.DOUBLE,
    },
    p10: {
      type: DataTypes.DOUBLE,
    },
  },
  {
    tableName: 'lighthouse_config',
    underscored: true,
    createdAt: true,
    updatedAt: false,
  },
);
