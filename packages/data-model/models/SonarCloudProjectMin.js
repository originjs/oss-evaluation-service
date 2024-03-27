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
      defaultValue: '',
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
      defaultValue: '',
    },
    maintainabilityRating: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    tableName: 'sonar_cloud_project',
    timestamps: false,
    underscored: true,
  },
);
