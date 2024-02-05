import {DataTypes} from "sequelize";
import sequelize from '../util/database.js';

export const WeekOfMonthMapper = sequelize.define(
    "weekOfMonth",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        start: {
            field: 'start',
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "起始时间"
        },
        end: {
            field: 'end',
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "结束时间"
        },
        weekOfMonth: {
            field: 'week_of_month',
            type: DataTypes.STRING(10),
            allowNull: true,
            comment: "月第几周",
        },
        createdAt: {
            field: 'created_at',
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
            comment: "创建时间",
        }
    },
    {
        sequelize,
        tableName: 'week_of_month',
        timestamps: false,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [
                    {name: "id"},
                ]
            },
            {
                name: "week_of_month_week_of_month_uindex",
                unique: true,
                using: "BTREE",
                fields: [
                    {name: "week_of_month"},
                    {name: "date"},
                ]
            },
        ]
    }
);
