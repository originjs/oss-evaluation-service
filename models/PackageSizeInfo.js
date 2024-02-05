import {DataTypes, Model} from "sequelize";
import sequelize from '../util/database.js';

export const PackageSizeInfo = sequelize.define(
    "PackageSizeInfo",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        version: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        repository: {
            type: DataTypes.STRING(512),
            allowNull: true
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "包大小"
        },
        size_of_gzip: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "gzip格式包大小"
        },
        create_time: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "创建时间"
        },
        last_updated_time: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "最近更新时间"
        },
        is_valid: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 1
        },
        description: {
            type: DataTypes.STRING(512),
            allowNull: true
        }
    },
    {
        tableName: 'package_size_info',
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
                name: "package_size_info_pk",
                unique: true,
                using: "BTREE",
                fields: [
                    {name: "name"},
                    {name: "version"},
                    {name: "repository"},
                ]
            },
            {
                name: "psi",
                using: "BTREE",
                fields: [
                    {name: "name"},
                    {name: "version"},
                    {name: "repository"},
                ]
            },
        ]
    }
);
