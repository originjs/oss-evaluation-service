import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'OssGitlabFork',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    githubProjectId: {
      type: DataTypes.INTEGER,
    },
    projectId: {
      type: DataTypes.INTEGER,
    },
    githubFullName: {
      type: DataTypes.STRING(512),
    },
    fullName: {
      type: DataTypes.STRING(512),
    },
    fullPath: {
      type: DataTypes.STRING(512),
    },
    name: {
      type: DataTypes.STRING(512),
    },
    defaultBranch: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: '',
    },
    namespaceId: {
      type: DataTypes.INTEGER,
    },
    namespaceName: {
      type: DataTypes.STRING(512),
    },
    namespacePath: {
      type: DataTypes.STRING(512),
    },
    sshCloneUrl: {
      type: DataTypes.STRING(512),
    },
    httpCloneUrl: {
      type: DataTypes.STRING(512),
    },
    webUrl: {
      type: DataTypes.STRING(512),
    },
  },
  {
    tableName: 'oss_gitlab_fork',
    timestamps: false,
    underscored: true,
  },
);
