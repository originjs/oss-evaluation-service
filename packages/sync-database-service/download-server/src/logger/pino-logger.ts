import pino from 'pino';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty', // 使输出更易读
    options: {
      colorize: true, // 颜色化输出
    },
  },
});

export default logger;
