import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'AlternativeProjects',
  {
    pId: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
    },
    alternativeId: {
      type: DataTypes.STRING(32),
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
