const isProduction = process.env.NODE_ENV === 'production';

export const JobConfig = {
  tasks: [
    {
      name: 'Compass',
      scheduleTime: '0 0 * * 1', // 周一 00:00
      enabled: isProduction,
    },
    {
      name: 'CncfDocumentScore',
      scheduleTime: '0 0 * * 2', // 周二 00:00
      enabled: isProduction, // only start in production environment
    },
  ],
};
