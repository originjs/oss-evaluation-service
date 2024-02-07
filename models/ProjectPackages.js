import {DataTypes, Model} from "sequelize";
import sequelize from '../util/database.js';

export default sequelize.define(
    "ProjectPackages",
    {
        project_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
        },
        project_name: {
            type: DataTypes.STRING
        },
        package: {
            type: DataTypes.STRING
        }
    },
    {
        tableName: 'project_packages',
        timestamps: true,
    }
);
