import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'StackOverFlow',
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
    wantedFrequency: {
      type: DataTypes.INTEGER,
    },
    admiredFrequency: {
      type: DataTypes.FLOAT,
    },
    wantedPercent: {
      type: DataTypes.INTEGER,
    },
    admiredPercent: {
      type: DataTypes.FLOAT,
    },
  },
  {
    tableName: 'stackoverflow_survey_result',
    underscored: true,
    createdAt: true,
    updatedAt: true,
  },
);
