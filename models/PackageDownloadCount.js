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
        date: {
            field: 'date',
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: "时间"
        },
        downloadCount: {
            field: 'download_count',
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "下载量",
        },
        lastUpdatedTime: {
            field: 'last_updated_time',
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
            comment: "最近更新时间",
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
                name: "package_download_count_package_name_date_uindex",
                unique: true,
                using: "BTREE",
                fields: [
                    {name: "package_name"},
                    {name: "date"},
                ]
            },
        ]
    }
);
