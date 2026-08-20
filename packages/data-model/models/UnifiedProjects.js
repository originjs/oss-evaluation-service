import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'UnifiedProjects',
  {
    pId: {
      type: DataTypes.STRING(32),
      primaryKey: true,
      field: 'p_id',
    },
    platformType: {
      type: DataTypes.INTEGER,
      field: 'platform_type',
    },
    id: {
      type: DataTypes.INTEGER,
      field: 'id',
    },
    name: {
      type: DataTypes.STRING(512),
      field: 'name',
    },
    fullName: {
      type: DataTypes.STRING(512),
      field: 'full_name',
    },
    type: {
      type: DataTypes.STRING(10),
      field: 'type',
    },
    htmlUrl: {
      type: DataTypes.STRING(512),
      field: 'html_url',
    },
    description: {
      type: DataTypes.TEXT,
      field: 'description',
    },
    privateFlag: {
      type: DataTypes.STRING(10),
      field: 'private_flag',
    },
    ownerName: {
      type: DataTypes.STRING(512),
      field: 'owner_name',
    },
    forkFlag: {
      type: DataTypes.STRING(10),
      field: 'fork_flag',
    },
    createdAt: {
      type: DataTypes.STRING(512),
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.STRING(512),
      field: 'updated_at',
    },
    pushedAt: {
      type: DataTypes.STRING(512),
      field: 'pushed_at',
    },
    gitUrl: {
      type: DataTypes.STRING(512),
      field: 'git_url',
    },
    cloneUrl: {
      type: DataTypes.STRING(512),
      field: 'clone_url',
    },
    size: {
      type: DataTypes.INTEGER,
      field: 'size',
    },
    codeSize: {
      type: DataTypes.INTEGER,
      field: 'code_size',
    },
    stargazersCount: {
      type: DataTypes.INTEGER,
      field: 'stargazers_count',
    },
    watchersCount: {
      type: DataTypes.INTEGER,
      field: 'watchers_count',
    },
    language: {
      type: DataTypes.STRING(512),
      field: 'language',
    },
    hasIssues: {
      type: DataTypes.STRING(10),
      field: 'has_issues',
    },
    forksCount: {
      type: DataTypes.INTEGER,
      field: 'forks_count',
    },
    archived: {
      type: DataTypes.STRING(10),
      field: 'archived',
    },
    disabled: {
      type: DataTypes.STRING(10),
      field: 'disabled',
    },
    openIssuesCount: {
      type: DataTypes.INTEGER,
      field: 'open_issues_count',
    },
    license: {
      type: DataTypes.STRING(512),
      field: 'license',
    },
    allowForking: {
      type: DataTypes.STRING(255),
      field: 'allow_forking',
    },
    topics: {
      type: DataTypes.STRING(512),
      field: 'topics',
    },
    visibility: {
      type: DataTypes.STRING(255),
      field: 'visibility',
    },
    forks: {
      type: DataTypes.INTEGER,
      field: 'forks',
    },
    openIssues: {
      type: DataTypes.INTEGER,
      field: 'open_issues',
    },
    watchers: {
      type: DataTypes.INTEGER,
      field: 'watchers',
    },
    defaultBranch: {
      type: DataTypes.STRING(512),
      field: 'default_branch',
    },
    ownerAvatarUrl: {
      type: DataTypes.STRING(512),
      field: 'owner_avatar_url',
    },
    ownerType: {
      type: DataTypes.STRING(255),
      field: 'owner_type',
    },
    ownerId: {
      type: DataTypes.STRING(512),
      field: 'owner_id',
    },
    ownerHtmlUrl: {
      type: DataTypes.STRING(512),
      field: 'owner_html_url',
    },
    sshUrl: {
      type: DataTypes.STRING(512),
      field: 'ssh_url',
    },
    svnUrl: {
      type: DataTypes.STRING(512),
      field: 'svn_url',
    },
    homePage: {
      type: DataTypes.STRING(512),
      field: 'home_page',
    },
    hasProjects: {
      type: DataTypes.STRING(10),
      field: 'has_projects',
    },
    hasDownloads: {
      type: DataTypes.STRING(10),
      field: 'has_downloads',
    },
    hasWiki: {
      type: DataTypes.STRING(10),
      field: 'has_wiki',
    },
    hasPages: {
      type: DataTypes.STRING(10),
      field: 'has_pages',
    },
    hasDiscussions: {
      type: DataTypes.STRING(10),
      field: 'has_discussions',
    },
    mirrorUrl: {
      type: DataTypes.STRING(512),
      field: 'mirror_url',
    },
    licenseName: {
      type: DataTypes.STRING(512),
      field: 'license_name',
    },
    isTemplate: {
      type: DataTypes.STRING(255),
      field: 'is_template',
    },
    webCommitSignoffRequired: {
      type: DataTypes.STRING(255),
      field: 'web_commit_signoff_required',
    },
    openAiRemark: {
      type: DataTypes.STRING(500),
      field: 'open_ai_remark',
    },
    openAiRecommendRemark: {
      type: DataTypes.STRING(500),
      field: 'open_ai_recommend_remark',
    },
    questionInfo: {
      type: DataTypes.STRING(1000),
      field: 'question_info',
    },
    prompt: {
      type: DataTypes.TEXT,
      field: 'prompt',
    },
    integratedState: {
      type: DataTypes.INTEGER,
      field: 'integrated_state',
    },
    contributors: {
      type: DataTypes.INTEGER,
      field: 'contributors',
    },
    dependentRepositories: {
      type: DataTypes.BIGINT,
      field: 'dependent_repositories',
    },
    dependentPackages: {
      type: DataTypes.BIGINT,
      field: 'dependent_packages',
    },
    lastUpdatedDate: {
      type: DataTypes.DATE,
      field: 'last_updated_date',
    },
    recordDesc: {
      type: DataTypes.STRING(255),
      field: 'record_desc',
    },
    dataType: {
      type: DataTypes.TINYINT,
      field: 'data_type',
    },
    aiDescription: {
      type: DataTypes.JSON,
      field: 'ai_description',
    },
    latestReleaseTagName: {
      type: DataTypes.STRING(255),
      field: 'latest_release_tag_name',
    },
    latestReleasePublishedAt: {
      type: DataTypes.STRING(512),
      field: 'latest_release_published_at',
    },
    openharmonyVersion: {
      type: DataTypes.JSON,
      field: 'openharmony_version',
    },
  },
  {
    tableName: 'unified_projects_t',
    timestamps: false,
    underscored: false,
  },
);
