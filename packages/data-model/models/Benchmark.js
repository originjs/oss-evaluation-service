import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'Benchmark',
  {
    pId: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    projectName: {
      type: DataTypes.STRING,
    },
    displayName: {
      type: DataTypes.STRING(256),
    },
    benchmark: {
      type: DataTypes.STRING,
    },
    techStack: {
      type: DataTypes.STRING,
    },
    rawValue: {
      type: DataTypes.FLOAT,
    },
    content: {
      type: DataTypes.JSON,
    },
    patchId: {
      type: DataTypes.STRING,
    },
    platform: {
      type: DataTypes.STRING,
    },
    bId: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'benchmark',
    underscored: true,
    timestamps: false,
  },
);
