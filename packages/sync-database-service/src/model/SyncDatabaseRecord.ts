import { DataTypes, Model } from 'sequelize';
import { innerSequelize } from './database.js';

export class SyncDatabaseRecord extends Model {
  public id!: string;
  public startFilename!: string;
  public startPosition!: number;
  public endFilename!: string;
  public endPosition!: number;
  public success!: number;
  public msg!: string;
  public startTime?: Date;
  public endTime?: Date;
}
SyncDatabaseRecord.init(
  {
    id: {
      type: DataTypes.INET,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    startFilename: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: '',
    },
    startPosition: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    endFilename: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: '',
    },
    endPosition: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    success: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    msg: {
      type: DataTypes.STRING(2000),
      allowNull: false,
      defaultValue: '',
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: innerSequelize,
    tableName: 'sync_record',
    underscored: true,
    timestamps: false,
  },
);
