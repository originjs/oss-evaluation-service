import {DataTypes, Model} from "sequelize";
import sequelize from '../util/database.js';

export const PackageSizeDetail = sequelize.define(
    "PackageSizeDetail",
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        package_name: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        version: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        clone_url: {
            type: DataTypes.STRING(512),
            allowNull: true
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "包大小"
        },
        gzip_sie: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "gzip格式包大小"
        },
        dependency_count: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "依赖数量"
        },
        createAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "创建时间"
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "最近更新时间"
        }
    },
    {
        tableName: 'package_size_detail',
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
                name: "pk_package_size_detail",
                unique: true,
                using: "BTREE",
                fields: [
                    {name: "package_name"},
                    {name: "version"},
                ]
            },
            {
                name: "index_package_size_detail",
                using: "BTREE",
                fields: [
                    {name: "package_name"},
                    {name: "version"},
                ]
            },
        ]
    }
);
