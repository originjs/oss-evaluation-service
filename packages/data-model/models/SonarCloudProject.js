import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'SonarCloudProject',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    githubFullName: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    sonarProjectKey: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    analysisDate: {
      type: DataTypes.DATE,
    },
    bugs: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    vulnerabilities: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    codeSmells: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'sonar_cloud_project',
    timestamps: false,
    underscored: true,
  },
);
