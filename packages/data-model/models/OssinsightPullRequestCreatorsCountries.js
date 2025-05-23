import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'OssinsightPullRequestCreatorsCountries',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    p_id: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: 'project id',
      unique: true,
    },
    country_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    pull_request_creators: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    percentage: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    sequelize,
    modelName: 'OssinsightPullRequestCreatorsCountry',
    tableName: 'ossinsight_pull_request_creators_countries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);
