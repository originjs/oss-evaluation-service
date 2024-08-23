import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'GithubProjectsHistory',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
    },
    dataType: {
      type: DataTypes.INTEGER,
    },
    increasedValue: {
      type: DataTypes.DOUBLE,
    },
    totalValue: {
      type: DataTypes.DOUBLE,
    },
    dateType: {
      type: DataTypes.INTEGER,
    },
    date: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: 'trend_history',
    underscored: true,
    timestamps: false,
  },
);
