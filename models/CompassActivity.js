import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'CompassActivity',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    repoUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activityScore: {
      type: DataTypes.DOUBLE,
    },
    closedIssuesCount: {
      type: DataTypes.INTEGER,
    },
    codeReviewCount: {
      type: DataTypes.INTEGER,
    },
    commentFrequency: {
      type: DataTypes.DOUBLE,
    },
    commitFrequency: {
      type: DataTypes.DOUBLE,
    },
    contributorCount: {
      type: DataTypes.INTEGER,
    },
    orgCount: {
      type: DataTypes.INTEGER,
    },
    recentReleasesCount: {
      type: DataTypes.INTEGER,
    },
    updatedIssuesCount: {
      type: DataTypes.INTEGER,
    },
    grimoireCreationDate: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: 'compass_activity_detail',
    underscored: true,
    createdAt: true,
    updatedAt: false,
  },
);
