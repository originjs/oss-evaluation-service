import { DataTypes, Model } from "sequelize";
import sequelize from '../util/database.js';

export const ProjectTechStack = sequelize.define(
  "ProjectTechStack",
  {
    project_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING
    },
    html_url: {
      type: DataTypes.STRING
    },
    category: {
      type: DataTypes.STRING
    },
    platform: {
      type: DataTypes.STRING
    },
    archived: {
      type: DataTypes.STRING
    }
  },
  {
    tableName: 'project_tech_stack',
    timestamps: false
  }
);
