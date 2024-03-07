import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'CncfDocumentScore',
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    repoUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    readme: {
      type: DataTypes.TEXT,
    },
    filename: {
      type: DataTypes.JSON,
    },
    website: {
      type: DataTypes.STRING,
    },
    release: {
      type: DataTypes.TEXT,
    },
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
    hasRelease: {
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
