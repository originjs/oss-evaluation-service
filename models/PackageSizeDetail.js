import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'PackageSizeDetail',
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    packageName: {
      type: DataTypes.STRING,
    },
    version: {
      type: DataTypes.STRING,
    },
    cloneUrl: {
      type: DataTypes.STRING,
    },
    size: {
      type: DataTypes.INTEGER,
    },
    gzipSize: {
      type: DataTypes.INTEGER,
    },
    dependencyCount: {
      type: DataTypes.INTEGER,
    },
    createAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: 'package_size_detail',
    timestamps: false,
    underscored: true,
  },
);
