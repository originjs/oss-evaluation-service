import {DataTypes} from 'sequelize';
import sequelize from '../util/database.js';

export const CompassActivity = sequelize.define(
    'compassActivity',
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            field: 'id'
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'project_id'
        },
        label: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'label'
        },
        closedIssuesCount: {
            type: DataTypes.INTEGER,
            field: 'closed_issues_count'
        },
        codeReviewCount: {
            type: DataTypes.INTEGER,
            field: 'code_review_count'
        },
        commentFrequency: {
            type: DataTypes.DOUBLE,
            field: 'comment_frequency'

        },
        commitFrequency: {
            type: DataTypes.DOUBLE,
            field: 'commit_frequency'
        },
        contributorCount: {
            type: DataTypes.INTEGER,
            field: 'contributor_count'

        },
        grimoireCreationDate: {
            type: DataTypes.TIME,
            field: 'grimoire_creation_date'
        },
        orgCount: {
            type: DataTypes.INTEGER,
            field: 'org_count'
        },
        recentReleasesCount: {
            type: DataTypes.INTEGER,
            field: 'recent_releases_count'
        },
        updatedIssuesCount: {
            type: DataTypes.INTEGER,
            field: 'updated_issues_count'
        },
        description: {
            type: DataTypes.STRING,
            field: 'description'
        },
        isValid: {
            type: DataTypes.INTEGER,
            field: 'is_valid'
        },
        lastUpdateTime: {
            type: DataTypes.TIME,
            field: 'last_update_time'
        },
        lastUpdateBy: {
            type: DataTypes.STRING,
            field: 'last_update_by'
        }
    },
    {
        tableName: 'compass_activity',
        timestamps: false
    }
)