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
    {
      name: 'evaluateTimer',
      cronScheduleTime: '0 0 1 * *', // 每月1号 00:00
      enabled: isProduction, // only start in production environment
    }
  ],
};
