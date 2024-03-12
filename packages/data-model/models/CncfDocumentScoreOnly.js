import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'CncfDocumentScoreOnly',
  {
    projectId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    documentScore: {
      type: DataTypes.DOUBLE,
    },
  },
  {
    tableName: 'cncf_document_score_only',
    underscored: true,
    createdAt: true,
    updatedAt: false,
  },
);
