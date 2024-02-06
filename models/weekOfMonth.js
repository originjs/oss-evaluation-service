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
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        end: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        weekOfMonth: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        }
    },
    {
        sequelize,
        tableName: 'week_of_month',
        timestamps: false,
        underscored: true,
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
