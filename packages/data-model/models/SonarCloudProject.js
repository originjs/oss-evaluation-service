import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'SonarCloudProject',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    pId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: -1,
    },
    gitlabProjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1,
    },
    forkPId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: -1,
    },
    forkGithubFullName: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: '',
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
    sonarOrg: {
      type: DataTypes.STRING(512),
      allowNull: false,
      defaultValue: '',
    },
    sonarProjectKey: {
      type: DataTypes.STRING(512),
      allowNull: false,
      defaultValue: '',
    },
    defaultBranch: {
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
    reliabilityRating: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    vulnerabilities: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    securityRating: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    securityHotspots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    securityHotspotsReviewed: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: '',
    },
    securityReviewRating: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    codeSmells: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    coverageRating: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    duplicatedLinesDensity: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    codeLines: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    maintainabilityRating: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    allMeasures: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'sonar_cloud_project',
    timestamps: false,
    underscored: true,
  },
);
