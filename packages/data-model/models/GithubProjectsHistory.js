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
    date: {
      type: DataTypes.DATEONLY,
    },
    contributors: {
      type: DataTypes.INTEGER,
    },
    stars: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'github_projects_history',
    underscored: true,
    timestamps: false,
  },
);
