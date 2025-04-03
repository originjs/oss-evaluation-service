import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'BenchmarkTechStacks',
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      primaryKey: true,
    },
    techStack: {
      type: DataTypes.STRING(128),
    },
    approved: {
      type: DataTypes.STRING(128),
    },
    description: {
      type: DataTypes.STRING(256),
    },
    category: {
      type: DataTypes.INTEGER,
    },
    subcategory: {
      type: DataTypes.STRING(128),
    },
    orderNum: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'benchmark_tech_stacks',
    underscored: true,
    timestamps: false,
  },
);
