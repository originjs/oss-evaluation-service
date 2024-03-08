import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'EvaluationSummary',
  {
    projectId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    projectName: {
      type: DataTypes.STRING,
    },
    techStack: {
      type: DataTypes.STRING,
    },
    functionValue: {
      type: DataTypes.DOUBLE,
    },
    functionScore: {
      type: DataTypes.DOUBLE,
    },
    qualityValue: {
      type: DataTypes.DOUBLE,
    },
    qualityScore: {
      type: DataTypes.DOUBLE,
    },
    performanceValue: {
      type: DataTypes.DOUBLE,
    },
    performanceScore: {
      type: DataTypes.DOUBLE,
    },
    ecologyValue: {
      type: DataTypes.DOUBLE,
    },
    ecologyScore: {
      type: DataTypes.DOUBLE,
    },
    innovationValue: {
      type: DataTypes.DOUBLE,
    },
    innovationScore: {
      type: DataTypes.DOUBLE,
    },
    evaluateTime: {
      type: DataTypes.DATE,
    },
    satisfaction: {
      type: DataTypes.DOUBLE,
    },
    docBestPractice: {
      type: DataTypes.DOUBLE,
    },
    scorecardScore: {
      type: DataTypes.DOUBLE,
    },
    criticalityScore: {
      type: DataTypes.DOUBLE,
    },
    openrank: {
      type: DataTypes.DOUBLE,
    },
    contributorCount: {
      type: DataTypes.INTEGER,
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
    orgCount: {
      type: DataTypes.INTEGER,
    },
    recentReleasesCount: {
      type: DataTypes.INTEGER,
    },
    updatedIssuesCount: {
      type: DataTypes.INTEGER,
    },
    // sonarcloudScore: {
    //   type: DataTypes.DOUBLE,
    // },
  },
  {
    tableName: 'oss_evaluation_summary',
    underscored: true,
    createdAt: false,
    updatedAt: 'evaluate_time',
  },
);
