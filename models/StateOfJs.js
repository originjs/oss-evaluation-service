import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'StateOfJs',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    projectName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.INTEGER,
    },
    technologyStack: {
      type: DataTypes.STRING,
    },
    year: {
      type: DataTypes.INTEGER,
    },
    usageRank: {
      type: DataTypes.INTEGER,
    },
    usagePercentage: {
      type: DataTypes.FLOAT,
    },
    awarenessRank: {
      type: DataTypes.INTEGER,
    },
    awarenessPercentage: {
      type: DataTypes.FLOAT,
    },
    interestRank: {
      type: DataTypes.INTEGER,
    },
    interestPercentage: {
      type: DataTypes.FLOAT,
    },
    satisfactionRank: {
      type: DataTypes.INTEGER,
    },
    satisfactionPercentage: {
      type: DataTypes.FLOAT,
    },
    wouldUseQuestionPercentage: {
      type: DataTypes.FLOAT,
    },
    wouldUseSurveyPercentage: {
      type: DataTypes.FLOAT,
    },
    wouldUseCount: {
      type: DataTypes.INTEGER,
    },
    wouldNotUseQuestionPercentage: {
      type: DataTypes.FLOAT,
    },
    wouldNotUseSurveyPercentage: {
      type: DataTypes.FLOAT,
    },
    wouldNotUseCount: {
      type: DataTypes.INTEGER,
    },
    interestedQuestionPercentage: {
      type: DataTypes.FLOAT,
    },
    interestedSurveyPercentage: {
      type: DataTypes.FLOAT,
    },
    interestedCount: {
      type: DataTypes.INTEGER,
    },
    notInterestedQuestionPercentage: {
      type: DataTypes.FLOAT,
    },
    notInterestedSurveyPercentage: {
      type: DataTypes.FLOAT,
    },
    notInterestedCount: {
      type: DataTypes.INTEGER,
    },
    neverHeardQuestionPercentage: {
      type: DataTypes.FLOAT,
    },
    neverHeardSurveyPercentage: {
      type: DataTypes.FLOAT,
    },
    neverHeardCount: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'state_of_js_detail',
    underscored: true,
    createdAt: true,
    updatedAt: true,
  },
);
