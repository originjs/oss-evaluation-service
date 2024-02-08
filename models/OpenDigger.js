import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'OpenDigger',
  {
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    openrank: {
      type: DataTypes.DOUBLE,
    },
    openrankDate: {
      type: DataTypes.STRING,
    },
    busFactor: {
      type: DataTypes.DOUBLE,
    },
    busFactorDate: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'opendigger_info',
    underscored: true,
    timestamps: true,
    createdAt: 'updated_at',
    updatedAt: true,
  },
);
