import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'CncfDocumentScoreMin',
  {
    documentScore: {
      type: DataTypes.DOUBLE,
    },
    hasReadme: {
      type: DataTypes.BOOLEAN,
    },
    hasChangelog: {
      type: DataTypes.BOOLEAN,
    },
    hasWebsite: {
      type: DataTypes.BOOLEAN,
    },
    hasContributing: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    tableName: 'cncf_document_score',
    underscored: true,
    createdAt: true,
    updatedAt: false,
  },
);
