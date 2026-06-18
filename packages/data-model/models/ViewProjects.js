import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'ViewProjects',
  {
    pId: {
      type: DataTypes.STRING(32),
      primaryKey: true,
    },
    platformType: {
      type: DataTypes.INTEGER,
    },
    id: {
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING(512),
    },
    fullName: {
      type: DataTypes.STRING(512),
    },
    htmlUrl: {
      type: DataTypes.STRING(512),
    },
    description: {
      type: DataTypes.STRING(512),
    },
    firstCommit: {
      type: DataTypes.STRING(512),
      field: 'created_at',
    },
    lastCommit: {
      type: DataTypes.STRING(512),
      field: 'pushed_at',
    },
    privateFlag: {
      type: DataTypes.STRING(10),
    },
    ownerName: {
      type: DataTypes.STRING(512),
    },
    forkFlag: {
      type: DataTypes.STRING(10),
    },
    createdAt: {
      type: DataTypes.STRING(512),
    },
    updatedAt: {
      type: DataTypes.STRING(512),
    },
    pushedAt: {
      type: DataTypes.STRING(512),
    },
    gitUrl: {
      type: DataTypes.STRING(512),
    },
    cloneUrl: {
      type: DataTypes.STRING(512),
    },
    size: {
      type: DataTypes.INTEGER,
    },
    codeSize: {
      type: DataTypes.INTEGER,
    },
    codeLines: {
      type: DataTypes.INTEGER,
      field: 'code_size',
    },
    stargazersCount: {
      type: DataTypes.INTEGER,
    },
    star: {
      type: DataTypes.INTEGER,
      field: 'stargazers_count',
    },
    watchersCount: {
      type: DataTypes.INTEGER,
    },
    language: {
      type: DataTypes.STRING(512),
    },
    hasIssues: {
      type: DataTypes.STRING(10),
    },
    forksCount: {
      type: DataTypes.INTEGER,
    },
    fork: {
      type: DataTypes.INTEGER,
      field: 'forks_count',
    },
    archived: {
      type: DataTypes.STRING(10),
    },
    disabled: {
      type: DataTypes.STRING(10),
    },
    openIssuesCount: {
      type: DataTypes.INTEGER,
    },
    allowForking: {
      type: DataTypes.STRING,
    },
    topics: {
      type: DataTypes.STRING(512),
    },
    tags: {
      type: DataTypes.STRING(512),
      field: 'topics',
    },
    visibility: {
      type: DataTypes.STRING,
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
      type: DataTypes.STRING(512),
    },
    ownerAvatarUrl: {
      type: DataTypes.STRING(512),
    },
    logo: {
      type: DataTypes.STRING(512),
      field: 'owner_avatar_url',
    },
    ownerType: {
      type: DataTypes.STRING,
    },
    ownerId: {
      type: DataTypes.STRING(512),
    },
    ownerHtmlUrl: {
      type: DataTypes.STRING(512),
    },
    sshUrl: {
      type: DataTypes.STRING(512),
    },
    svnUrl: {
      type: DataTypes.STRING(512),
    },
    homePage: {
      type: DataTypes.STRING(512),
    },
    hasProjects: {
      type: DataTypes.STRING(10),
    },
    hasDownloads: {
      type: DataTypes.STRING(10),
    },
    hasWiki: {
      type: DataTypes.STRING(10),
    },
    hasPages: {
      type: DataTypes.STRING(10),
    },
    hasDiscussions: {
      type: DataTypes.STRING(10),
    },
    mirrorUrl: {
      type: DataTypes.STRING(512),
    },
    licenseName: {
      type: DataTypes.STRING(512),
    },
    license: {
      type: DataTypes.STRING(512),
      field: 'license_name',
    },
    isTemplate: {
      type: DataTypes.STRING,
    },
    webCommitSignoffRequired: {
      type: DataTypes.STRING,
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
    integratedState: {
      type: DataTypes.INTEGER,
    },
    contributors: {
      type: DataTypes.INTEGER,
    },
    dependentRepositories: {
      type: DataTypes.BIGINT,
    },
    dependentPackages: {
      type: DataTypes.BIGINT,
    },
    recordDesc: {
      type: DataTypes.STRING(255),
    },
    aiDescription: {
      type: DataTypes.JSON,
    },
    latestReleaseTagName: {
      type: DataTypes.STRING(255),
    },
    latestReleasePublishedAt: {
      type: DataTypes.STRING(512),
    },
  },
  {
    tableName: 'view_projects',
    timestamps: false,
    underscored: true,
  },
);
