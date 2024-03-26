import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'ProjectInfo',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    tech_stack: {
      type: new DataTypes.VIRTUAL(),
    },
    repoName: {
      type: new DataTypes.VIRTUAL(),
    },
    url: {
      type: DataTypes.STRING(512),
      field: 'html_url',
    },
    description: {
      type: DataTypes.STRING(512),
    },
    firstCommit: {
      type: DataTypes.STRING(512),
      field: 'created_at',
    },
    star: {
      type: DataTypes.INTEGER,
      field: 'stargazers_count',
    },
    language: {
      type: DataTypes.STRING(512),
    },
    fork: {
      as: 'fork',
      type: DataTypes.INTEGER,
      field: 'forks_count',
    },
    license: {
      type: DataTypes.STRING(512),
      field: 'license_name',
    },
    tags: {
      type: DataTypes.STRING(512),
      field: 'topics',
    },
    logo: {
      type: DataTypes.STRING(512),
      field: 'owner_avatar_url',
    },
    codeLines: {
      type: DataTypes.INTEGER,
      field: 'code_size',
    },
  },
  {
    tableName: 'github_projects',
    timestamps: false,
    underscored: true,
  },
);
