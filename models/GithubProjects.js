import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'GithubProjects',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    fullName: {
      type: DataTypes.TEXT,
    },
    htmlUrl: {
      type: DataTypes.TEXT,
    },
    description: {
      type: DataTypes.STRING,
    },
    privateFlag: {
      type: DataTypes.TEXT,
    },
    ownerName: {
      type: DataTypes.TEXT,
    },
    fork_flag: {
      type: DataTypes.TEXT,
    },
    createdAt: {
      type: DataTypes.TEXT,
    },
    updatedAt: {
      type: DataTypes.TEXT,
    },
    pushedAt: {
      type: DataTypes.TEXT,
    },
    gitUrl: {
      type: DataTypes.TEXT,
    },
    cloneUrl: {
      type: DataTypes.TEXT,
    },
    size: {
      type: DataTypes.INTEGER,
    },
    stargazersCount: {
      type: DataTypes.INTEGER,
    },
    watchersCount: {
      type: DataTypes.INTEGER,
    },
    language: {
      type: DataTypes.TEXT,
    },
    hasIssues: {
      type: DataTypes.TEXT,
    },
    forksCount: {
      type: DataTypes.INTEGER,
    },
    archived: {
      type: DataTypes.TEXT,
    },
    disabled: {
      type: DataTypes.TEXT,
    },
    openIssuesCount: {
      type: DataTypes.INTEGER,
    },
    license: {
      type: DataTypes.TEXT,
    },
    allowForking: {
      type: DataTypes.TEXT,
    },
    topics: {
      type: DataTypes.TEXT,
    },
    visibility: {
      type: DataTypes.TEXT,
    },
    forks: {
      type: DataTypes.INTEGER,
    },
    openIssues: {
      type: DataTypes.INTEGER,
    },
    watchers: {
      type: DataTypes.INTEGER,
    },
    defaultBranch: {
      type: DataTypes.TEXT,
    },
    openAiRemark: {
      type: DataTypes.STRING,
    },
    openAiRecommendRemark: {
      type: DataTypes.STRING,
    },
    questionInfo: {
      type: DataTypes.STRING,
    },
    prompt: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'github_projects',
    timestamps: false,
    underscored: true,
  },
);
