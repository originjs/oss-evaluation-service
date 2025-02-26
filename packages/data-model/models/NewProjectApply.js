import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

const newProjectApply = sequelize.define(
  'NewProjectApply',
  {
    id: {
      type: DataTypes.STRING(256),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    repoUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    comment: {
      type: DataTypes.STRING(255),
    },
    username: {
      type: DataTypes.STRING(255),
    },
    alternativeProjectId: {
      type: DataTypes.STRING(255),
    },
    applicantEmail: {
      type: DataTypes.STRING(255),
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expandField1: {
      type: DataTypes.STRING(255),
      field: 'expand_field1',
    },
    techStack: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    subTechStack: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    employeeNumber: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: '',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      allowNull: false,
    },
    state: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    integrationFinishedTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING(256),
      allowNull: false,
      defaultValue: '',
    },
    envInfo: {
      type: DataTypes.STRING(512),
      allowNull: false,
      defaultValue: '',
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reason: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    tableName: 'new_project_apply',
    timestamps: false,
    underscored: true,
    noPrimaryKey: true,
  },
);
export default newProjectApply;
