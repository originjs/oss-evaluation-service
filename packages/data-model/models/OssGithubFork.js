import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'OssGithubFork',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    upstreamName: {
      type: DataTypes.STRING(512),
    },
    fullName: {
      type: DataTypes.STRING(512),
    },
    projectId: {
      type: DataTypes.INTEGER,
      unique: true,
    },
  },
  {
    tableName: 'oss_github_fork',
    timestamps: false,
    underscored: true,
  },
);
