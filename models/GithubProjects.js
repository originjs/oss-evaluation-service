import sequelize from "../util/database.js";
import DataTypes from "sequelize"

export const GithubProjects = sequelize.define(
    "GithubProjects",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING
        },
        fullName: {
            type: DataTypes.TEXT,
            field: 'full_name'
        },
        htmlUrl: {
            type: DataTypes.TEXT,
            field: 'html_url'
        },
        description: {
            type: DataTypes.STRING,
            field: 'description'
        },
        privateFlag: {
            type: DataTypes.TEXT,
            field: 'private_flag'
        },
        ownerName: {
            type: DataTypes.TEXT,
            field: 'owner_name'
        },
        fork_flag: {
            type: DataTypes.TEXT,
            field: 'fork_flag'
        },
        createdAt: {
            type: DataTypes.TEXT,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.TEXT,
            field: 'updated_at'
        },
        pushedAt: {
            type: DataTypes.TEXT,
            field: 'pushed_at'
        },
        gitUrl: {
            type: DataTypes.TEXT,
            field: 'git_url'
        },
        cloneUrl: {
            type: DataTypes.TEXT,
            field: 'clone_url'
        },
        size: {
            type: DataTypes.INTEGER,
            field: 'size'
        },
        stargazersCount: {
            type: DataTypes.INTEGER,
            field: 'stargazers_count'
        },
        watchersCount: {
            type: DataTypes.INTEGER,
            field: 'watchers_count'
        },
        language: {
            type: DataTypes.TEXT,
            field: 'language'
        },
        hasIssues: {
            type: DataTypes.TEXT,
            field: 'has_issues'
        },
        forksCount: {
            type: DataTypes.INTEGER,
            field: 'forks_count'
        },
        archived: {
            type: DataTypes.TEXT,
            field: 'archived'
        },
        disabled: {
            type: DataTypes.TEXT,
            field: 'disabled'
        },
        openIssuesCount: {
            type: DataTypes.INTEGER,
            field: 'open_Issues_count'
        },
        license: {
            type: DataTypes.TEXT,
            field: 'license'
        },
        allowForking: {
            type: DataTypes.TEXT,
            field: 'allow_forking'
        },
        topics: {
            type: DataTypes.TEXT,
            field: 'topics'
        },
        visibility: {
            type: DataTypes.TEXT,
            field: 'visibility'
        },
        forks: {
            type: DataTypes.INTEGER,
            field: 'forks'
        },
        openIssues: {
            type: DataTypes.INTEGER,
            field: 'open_issues'
        },
        watchers: {
            type: DataTypes.INTEGER,
            field: 'watchers'
        },
        defaultBranch: {
            type: DataTypes.TEXT,
            field: 'default_branch'
        },
        openAiRemark: {
            type: DataTypes.STRING,
            field: 'open_ai_remark'
        },
        openAiRecommendRemark: {
            type: DataTypes.STRING,
            field: 'open_ai_recommend_remark'
        },
        questionInfo: {
            type: DataTypes.STRING,
            field: 'question_info'
        },
        prompt: {
            type: DataTypes.TEXT,
            field: 'prompt'
        }
    },
    {
        tableName: 'github_projects'
    }
)