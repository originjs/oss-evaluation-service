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
    pId: {
      type: DataTypes.STRING(32),
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
      type: DataTypes.INTEGER,
    },
    dreadedFrequency: {
      type: DataTypes.INTEGER,
    },
    wantedPercent: {
      type: DataTypes.FLOAT,
    },
    admiredPercent: {
      type: DataTypes.FLOAT,
    },
    dreadedPercent: {
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
