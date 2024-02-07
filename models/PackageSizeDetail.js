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
            allowNull: true
        },
        gzip_size: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        dependency_count: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        createAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: true
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
