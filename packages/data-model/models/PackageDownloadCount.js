import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'PackageDownloadCount',
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    packageName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    week: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    downloads: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),

    },
  },
  {
    sequelize,
    tableName: 'package_download_count',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'PRIMARY',
        unique: true,
        using: 'BTREE',
        fields: [
          { name: 'id' },
        ],
      },
      {
        name: 'package_download_count_package_name_week_uindex',
        unique: true,
        using: 'BTREE',
        fields: [
          { name: 'package_name' },
          { name: 'week' },
        ],
      },
    ],
  },
);
