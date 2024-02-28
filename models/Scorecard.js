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
      type: DataTypes.STRING,
    },
    score: {
      type: DataTypes.INTEGER,
    },
    commit: {
      type: DataTypes.STRING,
    },
    code_review: {
      type: DataTypes.INTEGER,
    },
    maintained: {
      type: DataTypes.INTEGER,
    },
    cii_best_practices: {
      type: DataTypes.INTEGER,
    },
    license: {
      type: DataTypes.INTEGER,
    },
    signed_releases: {
      type: DataTypes.INTEGER,
    },
    packaging: {
      type: DataTypes.INTEGER,
    },
    token_permissions: {
      type: DataTypes.INTEGER,
    },
    dangerous_workflow: {
      type: DataTypes.INTEGER,
    },
    pinned_dependencies: {
      type: DataTypes.INTEGER,
    },
    branch_protection: {
      type: DataTypes.INTEGER,
    },
    binary_artifacts: {
      type: DataTypes.INTEGER,
    },
    fuzzing: {
      type: DataTypes.INTEGER,
    },
    security_policy: {
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
    timestamps: true,
    createdAt: false,
    updatedAt: true,
  },
);
