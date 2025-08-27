import { DataTypes } from 'sequelize';
import { sequelizeExt } from '../util/database.js';

const projectStackFromAiTableExists = async () => {
  try {
    await sequelizeExt.queryInterface.describeTable('project_stack_from_ai');
    return true;
  } catch (error) {
    return false;
  }
};

const isInner = await projectStackFromAiTableExists();

const ProjectStackFromAi = isInner
  ? sequelizeExt.define(
      'ProjectStackFromAi',
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        landscape: {
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
        description: {
          type: DataTypes.STRING,
        },
        reasons: {
          type: DataTypes.STRING,
        },
        html_url: {
          type: DataTypes.STRING,
        },
        github_id: {
          type: DataTypes.STRING,
        },
        label: {
          type: DataTypes.STRING,
        },
        language: {
          type: DataTypes.STRING,
        },
        is_valid: {
          type: DataTypes.TINYINT,
          defaultValue: 1,
          allowNull: false,
        },
      },
      {
        tableName: 'project_stack_from_ai',
        underscored: true,
        timestamps: false,
        noPrimaryKey: true,
      },
    )
  : null;

export default ProjectStackFromAi;
