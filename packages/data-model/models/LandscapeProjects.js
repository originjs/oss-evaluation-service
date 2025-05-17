import { DataTypes } from 'sequelize';
import { sequelizeExt } from '../util/database.js';

const landscapeProjectsTableExists = async () => {
  try {
    await sequelizeExt.queryInterface.describeTable('landscape_projects');
    return true;
  } catch (error) {
    return false;
  }
};

const isInner = await landscapeProjectsTableExists();
const LandscapeProjects = isInner
  ? sequelizeExt.define(
      'LandscapeProjects',
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        landscspe: {
          type: DataTypes.STRING,
        },
        category: {
          type: DataTypes.STRING,
        },
        subcategory: {
          type: DataTypes.STRING,
        },
        name: {
          type: DataTypes.STRING,
        },
        describtion: {
          type: DataTypes.STRING,
        },
        html_url: {
          type: DataTypes.STRING,
        },
        github_id: {
          type: DataTypes.STRING,
        },
        lable: {
          type: DataTypes.STRING,
        },
        is_valid: {
          type: DataTypes.TINYINT,
          defaultValue: 1,
          allowNull: false,
        },
      },
      {
        tableName: 'landscape_projects',
        underscored: true,
        createdAt: true,
        updatedAt: true,
      },
    )
  : null;

export default LandscapeProjects;
