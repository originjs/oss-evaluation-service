import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'AlternativeProjects',
  {
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
    },
    alternativeId: {
      type: DataTypes.BIGINT,
    },
    alternativeName: {
      type: DataTypes.STRING,
    },
    alternativeUrl: {
      type: DataTypes.STRING,
    },
    distance: {
      type: DataTypes.FLOAT,
    },
    source: {
      type: DataTypes.STRING,
    },
    approved: {
      type: DataTypes.TINYINT,
    },
  },
  {
    tableName: 'alternative_projects',
    underscored: true,
    createdAt: true,
    updatedAt: true,
  },
);
