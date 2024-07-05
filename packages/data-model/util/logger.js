import winston from 'winston';
import 'winston-daily-rotate-file';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ProjectRootPath = path.join(__dirname, '..');
const logDir = process.env.LOG_DIR ? process.env.LOG_DIR : 'logs';

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
  filename: path.join(logDir, '%DATE%-info.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  format: fileFormat,
  maxSize: '20m',
  maxFiles: '14d',
  handleExceptions: true,
  handleRejections: true,
});

const transportError = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, '%DATE%-error.log'),
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

let transports = [];
// Do not output log to console in the production environment
if (process.env.NODE_ENV !== 'production') {
  transports = [consoleTransport];
} else {
  transports = [transportError, transportInfo];
}

const customizedLogger = winston.createLogger({
  level: 'info',
  transports: transports,
});

// 处理文件名和行号
function getFileNameAndLineNumber() {
  const stackInfo = getStackInfo(1);
  if (stackInfo) {
    return '[' + stackInfo.relativePath + ':' + stackInfo.line + ':' + stackInfo.pos + '] ';
  }
  return '';
}
function getStackInfo(stackIndex) {
  const stacklist = new Error().stack.split('\n').slice(3);

  const stackReg = /at ([\w.]+) \(file:\/\/\/(.*?):(\d+):(\d+)\)/gi;
  const s = stacklist[stackIndex] || stacklist[0];
  const sp = stackReg.exec(s);

  if (sp && sp.length === 5) {
    return {
      method: sp[1],
      relativePath: path.relative(ProjectRootPath, sp[2]),
      line: sp[3],
      pos: sp[4],
      file: path.basename(sp[2]),
      stack: stacklist.join('\n'),
    };
  }
}

// handle format
const logger = {
  info: (...args) => {
    customizedLogger.info(getFileNameAndLineNumber() + util.format(...args));
  },
  error: (...args) => {
    customizedLogger.error(getFileNameAndLineNumber() + util.format(...args));
  },
  warn: (...args) => {
    customizedLogger.warn(getFileNameAndLineNumber() + util.format(...args));
  },
};

export default logger;
