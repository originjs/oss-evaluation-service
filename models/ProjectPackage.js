import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'ProjectPackage',
  {
    projectId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    projectName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    package: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'project_packages',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        name: 'idx_project_id',
        using: 'BTREE',
        fields: [
          { name: 'project_id' },
        ],
      },
    ],
  },
);
