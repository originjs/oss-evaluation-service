const isProduction = process.env.NODE_ENV === 'production';

export const JobConfig = {
  isProduction: isProduction,
  tasks: [
    {
      name: 'cncfDocumentScoreTimer',
      cronScheduleTime: '0 0 * * 1', // 周一 00:00
      enabled: isProduction,
    },
    {
      name: 'packageDownloadCountTimer',
      cronScheduleTime: '0 0 * * 3', // 周三 00:00
      enabled: isProduction, // only start in production environment
    },
    {
      name: 'projectCodeSizeTimer',
      cronScheduleTime: '0 0 * * 4', // 周四 00:00
      enabled: isProduction, // only start in production environment
    },
    {
      name: 'projectDependentCountTimer',
      cronScheduleTime: '0 0 * * 5', // 周五 00:00
      enabled: isProduction, // only start in production environment
    },
    {
      name: 'projectContributorsTimer',
      cronScheduleTime: '0 0 * * 6', // 周六 00:00
      enabled: isProduction, // only start in production environment
    },
    {
      name: 'evaluateTimer',
      cronScheduleTime: '0 0 1 * *', // 每月1号 00:00
      enabled: isProduction, // only start in production environment
    },
    {
      name: 'projectHistoryTimer',
      cronScheduleTime: '0 0 * * *', // 每天 00:00执行，实际会在代码中控制每月1号和每周的第一天执行
      enabled: isProduction,
    },
    {
      name: 'githubProjectsDailyTimer',
      cronScheduleTime: '0 0 * * *', // 每天 00:00
      enabled: isProduction, // only start in production environment
    },
    {
      name: 'githubProjectsWeeklyTimer',
      cronScheduleTime: '0 0 * * 1', // 周一 00:00
      enabled: isProduction, // only start in production environment
    },
    {
      name: 'githubStargazersTrendTimer',
      cronScheduleTime: '0 12 5 * *', // 每月5号 12:00
      enabled: isProduction, // only start in production environment
    },
    {
      name: 'openharmonyTimer',
      cronScheduleTime: '0 2 * * 1', // 周一 02:00 同步 OpenHarmony 组织仓库并解析适配大版本
      enabled: isProduction, // only start in production environment
    },
    {
      name: 'projectReleaseTimer',
      cronScheduleTime: '0 0 * * 2', // 周二 00:00 全量同步 Release 信息，每项目间隔 500ms 防限流
      enabled: isProduction,
    },
    {
      name: 'projectAlternativeTimer',
      cronScheduleTime: '0 4 * * 2', // 周二 04:00 同步 AI 相似软件推荐（只处理 null）
      enabled: isProduction,
    },
    {
      name: 'projectDescriptionTimer',
      cronScheduleTime: '0 4 * * 3', // 周三 04:00 同步 AI 项目描述（只处理 null）
      enabled: isProduction,
    },
  ],
};
