import {DataTypes} from "sequelize";
import sequelize from '../util/database.js';

export const ProjectPackageMapper = sequelize.define(
    "ProjectPackage",
    {
        projectId: {
            field: 'project_id',
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        projectName: {
            field: 'project_name',
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        package: {
            field: 'package',
            type: DataTypes.STRING(255),
            allowNull: true,
        }
    },
    {
        sequelize,
        tableName: 'project_packages',
        timestamps: false,
        indexes: [
            {
                name: "idx_project_id",
                using: "BTREE",
                fields: [
                    {name: "project_id"}
                ]
            },
        ]
    }
);
