import {DataTypes} from "sequelize";
import sequelize from '../util/database.js';

export const PackageDownloadCountMapper = sequelize.define(
    "PackageDownloadCount",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        packageName: {
            field: 'package_name',
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: "包名",
        },
        startDate: {
            field: 'start_date',
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "起始时间"
        },
        endDate: {
            field: 'end_date',
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "结束时间"
        },
        week: {
            field: 'week',
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: "week of month",
        },
        downloads: {
            field: 'downloads',
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "下载量",
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
        tableName: 'package_download_count',
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
                name: "package_download_count_package_name_week_uindex",
                unique: true,
                using: "BTREE",
                fields: [
                    {name: "package_name"},
                    {name: "week"},
                ]
            },
        ]
    }
);
