import winston from 'winston';
import 'winston-daily-rotate-file';

const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level} : ${message}`;
});

const levelToUpperCase = winston.format(info => {
  info.level = info.level.toUpperCase();
  return info;
})();

const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  levelToUpperCase,
  winston.format.colorize(),
  logFormat,
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  levelToUpperCase,
  logFormat,
);

const transportInfo = new winston.transports.DailyRotateFile({
  filename: 'logs/%DATE%-info.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d',
  handleExceptions: true,
  handleRejections: true,
});

const transportError = new winston.transports.DailyRotateFile({
  filename: 'logs/%DATE%-error.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  handleExceptions: true,
  handleRejections: true,
});

const consoleTransport = new winston.transports.Console({
  handleExceptions: true,
  handleRejections: true,
  format: consoleFormat,
});

// Function to calculate request processing time
export function getDurationInMilliseconds(start) {
  const NS_PER_SEC = 1e9; // convert to nanoseconds
  const NS_TO_MS = 1e6; // convert to milliseconds
  const diff = process.hrtime(start);

  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
}

const logger = winston.createLogger({
  level: 'info',
  transports: [transportError, transportInfo],
});

// Do not output log to console in the production environment
if (process.env.NODE_ENV !== 'production') {
  logger.add(consoleTransport);
}

export default logger;
