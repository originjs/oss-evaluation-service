import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'GithubProjectsDependencies',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    pId: {
      type: DataTypes.STRING(32),
    },
    fullName: {
      type: DataTypes.STRING(100),
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
    ownerType: {
      type: DataTypes.STRING(100),
    },
    dependentPId: {
      type: DataTypes.STRING(32),
    },
    dependentFullName: {
      type: DataTypes.STRING(100),
    },
    dependentOwnerName: {
      type: DataTypes.STRING(512),
    },
    dependentName: {
      type: DataTypes.STRING(512),
    },
    dependentRequirements: {
      type: DataTypes.STRING(100),
    },
    dependentHtmlUrl: {
      type: DataTypes.STRING(512),
    },
    dependentOwnerType: {
      type: DataTypes.STRING(100),
    },
    lastUpdatedDate: {
      type: DataTypes.DATE,
    },
    deleted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'github_projects_dependencies',
    timestamps: false,
    underscored: true,
  },
);
