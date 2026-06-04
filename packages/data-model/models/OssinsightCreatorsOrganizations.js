import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'OssinsightCreatorsOrganizations',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    pId: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: 'project id',
    },
    org_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    creators_num: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    percentage: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    type: {
      type: DataTypes.INTEGER,
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
    modelName: 'OssinsightCreatorsOrganizations',
    tableName: 'ossinsight_creators_organizations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  },
);
