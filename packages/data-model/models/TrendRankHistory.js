import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'TrendRankHistory',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pId: {
      type: DataTypes.STRING(32),
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
      type: DataTypes.DATEONLY,
    },
    rankType: {
      type: DataTypes.INTEGER,
    },
    rankColumn: {
      type: DataTypes.INTEGER,
      field: 'rank',
    },
  },
  {
    tableName: 'trend_rank_history',
    underscored: true,
    timestamps: false,
  },
);
