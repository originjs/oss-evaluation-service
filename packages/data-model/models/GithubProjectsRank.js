import DataTypes from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'GithubProjectsRank',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: '',
    },
    homeUrl: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: '',
    },
    orderNum: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1,
    },
    type: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: '',
    },
  },
  {
    tableName: 'github_projects_rank',
    timestamps: false,
    underscored: true,
  },
);
