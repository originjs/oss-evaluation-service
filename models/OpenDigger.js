import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'OpenDigger',
  {
    project_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    openrank: {
      type: DataTypes.DOUBLE,
    },
    openrank_date: {
      type: DataTypes.STRING,
    },
    bus_factor: {
      type: DataTypes.DOUBLE,
    },
    bus_factor_date: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'opendigger_info',
    timestamps: true,
    createdAt: false,
    updatedAt: true,
  },
);
