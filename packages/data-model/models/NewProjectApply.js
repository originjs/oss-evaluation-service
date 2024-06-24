import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

let newProjectApply = sequelize.define(
  'NewProjectApply',
  {
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
      allowNull: false
    },
    expandField1: {
      type: DataTypes.STRING(255),
      field: 'expand_field1',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      allowNull: false,
    },
  },
  {
    tableName: 'new_project_apply',
    timestamps: false,
    underscored: true,
    noPrimaryKey: true,
  },
);
newProjectApply.removeAttribute('id');
export default newProjectApply;
