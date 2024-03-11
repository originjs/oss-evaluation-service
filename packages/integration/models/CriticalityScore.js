import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'Criticality_Score',
  {
    projectId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    projectName: {
      type: DataTypes.STRING,
    },
    repoUrl: {
      type: DataTypes.STRING,
    },
    score: {
      type: DataTypes.FLOAT,
    },
    collectionDate: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'criticality_score',
    underscored: true,
    timestamps: false,
  },
);
