import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'ScorecardComplem',
  {
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    htmlUrl: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
    },
    platform: {
      type: DataTypes.STRING,
    },
    archived: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'scorecard_complementery',
    timestamps: false,
    underscored: true,
  },
);
