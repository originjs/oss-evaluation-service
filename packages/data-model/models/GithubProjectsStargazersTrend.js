import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'GithubProjectsStargazersTrend',
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    pId: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    htmlUrl: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    stargazers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    tableName: 'github_projects_stargazers_trend',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'PRIMARY',
        unique: true,
        using: 'BTREE',
        fields: [{ name: 'id' }],
      },
      {
        name: 'stargazers_index',
        unique: true,
        using: 'BTREE',
        fields: [{ name: 'full_name' }, { name: 'date' }],
      },
    ],
  },
);
