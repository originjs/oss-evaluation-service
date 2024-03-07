import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'Scorecard',
  {
    projectId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    repoName: {
      type: DataTypes.STRING,
    },
    collectionDate: {
      type: DataTypes.STRING,
    },
    score: {
      type: DataTypes.INTEGER,
    },
    commit: {
      type: DataTypes.STRING,
    },
    codeReview: {
      type: DataTypes.INTEGER,
    },
    maintained: {
      type: DataTypes.INTEGER,
    },
    ciiBestPractices: {
      type: DataTypes.INTEGER,
    },
    license: {
      type: DataTypes.INTEGER,
    },
    signedReleases: {
      type: DataTypes.INTEGER,
    },
    packaging: {
      type: DataTypes.INTEGER,
    },
    tokenPermissions: {
      type: DataTypes.INTEGER,
    },
    dangerousWorkflow: {
      type: DataTypes.INTEGER,
    },
    pinnedDependencies: {
      type: DataTypes.INTEGER,
    },
    branchProtection: {
      type: DataTypes.INTEGER,
    },
    binaryArtifacts: {
      type: DataTypes.INTEGER,
    },
    fuzzing: {
      type: DataTypes.INTEGER,
    },
    securityPolicy: {
      type: DataTypes.INTEGER,
    },
    sast: {
      type: DataTypes.INTEGER,
    },
    vulnerabilities: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'scorecard_info',
    createdAt: false,
    updatedAt: true,
    underscored: true,
  },
);
