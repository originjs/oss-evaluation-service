import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'Scorecard',
  {
    project_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    repo_name: {
      type: DataTypes.STRING,
    },
    collection_date: {
      type: DataTypes.STRING
    },
    score: {
      type: DataTypes.INTEGER,
    },
    commit: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'scorecard_info',
    timestamps: true,
    createdAt: false,
    updatedAt: true
  }
);
