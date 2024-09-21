const isProduction = process.env.NODE_ENV === 'production';

export const JobConfig = {
  isProduction: isProduction,
  tasks: [
    {
      name: 'evaluateTimer',
      cronScheduleTime: '0 0 1 * *', // 每月1号 00:00
      enabled: true, // only start in production environment
    },
    {
      name: 'projectHistoryTimer',
      cronScheduleTime: '0 0 * * *', // 每天 00:00执行，实际会在代码中控制每月1号和每周的第一天执行
      enabled: true,
    },
    {
      name: 'githubProjectsDailyTimer',
      cronScheduleTime: '0 0 * * *', // 每天 00:00
      enabled: true, // only start in production environment
    },
    {
      name: 'githubProjectsWeeklyTimer',
      cronScheduleTime: '0 0 * * 1', // 周一 00:00
      enabled: false, // only start in production environment
    },
  ],
};
