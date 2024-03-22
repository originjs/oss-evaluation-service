import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'SonarCloudProject',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    githubProjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1,
    },
    gitlabProjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1,
    },
    githubFullName: {
      type: DataTypes.STRING(512),
      allowNull: false,
      defaultValue: '',
    },
    gitlabFullName: {
      type: DataTypes.STRING(512),
      allowNull: false,
      defaultValue: '',
    },
    sonarProjectKey: {
      type: DataTypes.STRING(512),
      allowNull: false,
      defaultValue: '',
    },
    analysisDate: {
      type: DataTypes.DATE,
    },
    bugs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    vulnerabilities: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    codeSmells: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'sonar_cloud_project',
    timestamps: false,
    underscored: true,
  },
);
