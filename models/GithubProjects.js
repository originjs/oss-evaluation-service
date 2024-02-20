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
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    fullName: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    htmlUrl: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    description: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    privateFlag: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    ownerName: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    forkFlag: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    createdAt: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    updatedAt: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    pushedAt: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    gitUrl: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    cloneUrl: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    size: {
      type: DataTypes.INTEGER,
      updateFlag: true,
    },
    stargazersCount: {
      type: DataTypes.INTEGER,
      updateFlag: true,
    },
    watchersCount: {
      type: DataTypes.INTEGER,
      updateFlag: true,
    },
    language: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    hasIssues: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    forksCount: {
      type: DataTypes.INTEGER,
      updateFlag: true,
    },
    archived: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    disabled: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    openIssuesCount: {
      type: DataTypes.INTEGER,
      updateFlag: true,
    },
    license: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    allowForking: {
      type: DataTypes.STRING,
      updateFlag: true,
    },
    topics: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    visibility: {
      type: DataTypes.STRING,
      updateFlag: true,
    },
    forks: {
      type: DataTypes.INTEGER,
      updateFlag: true,
    },
    openIssues: {
      type: DataTypes.INTEGER,
      updateFlag: true,
    },
    watchers: {
      type: DataTypes.INTEGER,
      updateFlag: true,
    },
    defaultBranch: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    ownerAvatarUrl: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    ownerType: {
      type: DataTypes.STRING,
      updateFlag: true,
    },
    ownerId: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    ownerHtmlUrl: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    sshUrl: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    svnUrl: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    homePage: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    hasProjects: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    hasDownloads: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    hasWiki: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    hasPages: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    hasDiscussions: {
      type: DataTypes.STRING(10),
      updateFlag: true,
    },
    mirrorUrl: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    licenseName: {
      type: DataTypes.STRING(512),
      updateFlag: true,
    },
    isTemplate: {
      type: DataTypes.STRING,
      updateFlag: true,
    },
    webCommitSignoffRequired: {
      type: DataTypes.STRING,
      updateFlag: true,
    },
    openAiRemark: {
      type: DataTypes.STRING(500),
    },
    openAiRecommendRemark: {
      type: DataTypes.STRING(500),
    },
    questionInfo: {
      type: DataTypes.STRING(1000),
    },
    prompt: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'github_projects_new',
    timestamps: false,
    underscored: true,
  }
);
