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
      name: 'compassTimer',
      cronScheduleTime: '0 0 * * 2', // 周二 00:00
      enabled: isProduction, // only start in production environment
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
    // 下面的定时器用于爬取github的页面(非api接口)的star和contributor供趋势榜单使用，由于需要访问github页面，所以最好在海外或者有代理的机器上执行
    // 目前在提供sonarCloud扫描服务的机器上执行，关闭其他服务器上的执行防止冲突
    {
      name: 'evaluateTimer',
      cronScheduleTime: '0 0 1 * *', // 每月1号 00:00
      enabled: false, // only start in production environment
    },
    {
      name: 'projectHistoryTimer',
      cronScheduleTime: '0 0 * * *', // 每天 00:00执行，实际会在代码中控制每月1号和每周的第一天执行
      enabled: false,
    },
    {
      name: 'githubProjectsDailyTimer',
      cronScheduleTime: '0 0 * * *', // 每天 00:00
      enabled: false, // only start in production environment
    },
    {
      name: 'githubProjectsWeeklyTimer',
      cronScheduleTime: '0 0 * * 1', // 周一 00:00
      enabled: false, // only start in production environment
    },
    {
      name: 'githubStargazersTrendTimer',
      cronScheduleTime: '0 12 5 * *', // 每月5号 12:00
      enabled: isProduction, // only start in production environment
    },
  ],
};
