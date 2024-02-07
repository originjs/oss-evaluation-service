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
        repoUrl: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'repo_url'
        },
        activityScore: {
            type: DataTypes.DOUBLE,
            field: 'activity_score'
        },
        closedIssuesCount: {
            type: DataTypes.INTEGER,
            field: 'closed_issues_count'
        },
        codeReviewCount: {
            type: DataTypes.INTEGER,
            field: 'code_review_count'
        },
        issueCommentFrequency: {
            type: DataTypes.DOUBLE,
            field: 'issue_comment_frequency'

        },
        commitFrequency: {
            type: DataTypes.DOUBLE,
            field: 'commit_frequency'
        },
        contributorCount: {
            type: DataTypes.INTEGER,
            field: 'contributor_count'
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
        grimoireCreationDate: {
            type: DataTypes.TIME,
            field: 'grimoire_creation_date'
        },
        createdAt: {
            type: DataTypes.TIME,
            field: 'created_at'
        }
    },
    {
        tableName: 'compass_activity_detail',
        underscored: true,
        createdAt: true,
        updatedAt: false
    }
)