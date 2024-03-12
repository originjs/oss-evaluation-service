import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'ProjectTechStack',
  {
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    htmlUrl: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
    },
    subcategory: {
      type: DataTypes.STRING,
    },
    platform: {
      type: DataTypes.STRING,
    },
    archived: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'project_tech_stack',
    timestamps: false,
    underscored: true,
  },
);
