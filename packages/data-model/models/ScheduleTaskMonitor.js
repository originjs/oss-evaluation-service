import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'ScheduleTaskMonitor',
  {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    taskId: {
      type: DataTypes.STRING,
    },
    taskName: {
      type: DataTypes.STRING,
    },
    taskDesc: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.INTEGER,
    },
    messaged: {
      type: DataTypes.INTEGER,
    },
    startTime: {
      type: DataTypes.TIME,
    },
    endTime: {
      type: DataTypes.TIME,
    },
    duration: {
      type: DataTypes.INTEGER,
    },
    cron: {
      type: DataTypes.STRING,
    },
    ip: {
      type: DataTypes.STRING,
    },
    taskException: {
      type: DataTypes.STRING,
    },
    isValid: {
      type: DataTypes.INTEGER,
    },
    lastUpdatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  },
  {
    tableName: 'schedule_task_monitor',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'PRIMARY',
        unique: true,
        using: 'BTREE',
        fields: [{ name: 'id' }],
      },
      {
        name: 'schedule_task_monitor_task_id_index',
        unique: true,
        using: 'BTREE',
        fields: [{ name: 'task_id' }],
      },
    ],
  },
);
