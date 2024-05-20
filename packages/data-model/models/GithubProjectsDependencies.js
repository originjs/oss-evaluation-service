import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'GithubProjectsDependencies',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoincrement: true
    },
    fullName: {
      type: DataTypes.STRING(512),
    },
    ownerName: {
      type: DataTypes.STRING(512),
    },
    name: {
      type: DataTypes.STRING(512),
    },
    language: {
      type: DataTypes.STRING(10),
    },
    dependentFullName: {
      type: DataTypes.STRING(512),
    },
    dependentOwnerName: {
      type: DataTypes.STRING(512),
    },
    dependentName: {
      type: DataTypes.STRING(512),
    },
    dependentHtmlUrl: {
      type: DataTypes.STRING(512),
    },
    lastUpdatedDate: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: 'github_projects_dependencies',
    timestamps: false,
    underscored: true,
  },
);
