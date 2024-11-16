import { logger, ScheduleTaskMonitor } from '@orginjs/oss-evaluation-data-model';
import * as uuid from 'uuid';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { JobConfig } from './config.js';
import os from 'os';
dayjs.extend(utc);

/**
 * addMonitoringToTask
 *
 * @param func func
 * @param taskName task name
 * @param taskDesc task description
 * @returns Proxy proxy
 */
export function addMonitoringToTask(func, taskName, taskDesc) {
  return createTaskMonitor(func, taskName, taskDesc);
}

function createTaskMonitor(func, taskName, taskDesc) {
  const taskMap = new Map(JobConfig.tasks.map(task => [task.name, task]));
  return new Proxy(func, {
    async apply(target, thisArg, argumentsList) {
      // Generate a taskId using UUID
      const taskId = uuid.v4();
      await writeLog(taskId, taskName, taskDesc, '', taskMap);
      logger.info(`task ${taskName} start execution`);
      try {
        const result = await Reflect.apply(target, thisArg, argumentsList);
        logger.info(`task ${taskName} execution success`);
        await writeLog(taskId, taskName, taskDesc, '', taskMap);
        return result;
      } catch (error) {
        logger.error(`task ${taskName} execution failed : ${error.message}`);
        await writeLog(taskId, taskName, taskDesc, error.message, taskMap);
      }
    },
  });
}

const taskStatus = Object.freeze({
  IN_PROGRESS: 0,
  SUCCESS: 1,
  FAILED: 2,
});

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '0.0.0.0';
}

async function writeLog(taskId, taskName, taskDesc, errorMsg, taskMap) {
  let task = await ScheduleTaskMonitor.findOne({
    where: {
      taskId: taskId,
    },
  });
  const currentTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
  if (task == null) {
    await ScheduleTaskMonitor.create({
      taskId: taskId,
      taskName: taskName,
      taskDesc: taskDesc,
      startTime: currentTime,
      status: taskStatus.IN_PROGRESS,
      cron: taskMap.get(taskName).cronScheduleTime,
      ip: getLocalIp(),
    });
  } else {
    // Calculate the difference between the current time and the task start time
    const duration = dayjs().utc().diff(dayjs(task.startTime).utc(), 'second');
    await ScheduleTaskMonitor.upsert({
      taskId: taskId,
      taskName: taskName,
      taskDesc: taskDesc,
      startTime: task.startTime,
      endTime: currentTime,
      duration: duration,
      status: errorMsg === '' ? taskStatus.SUCCESS : taskStatus.FAILED,
      cron: taskMap.get(taskName).cronScheduleTime,
      ip: getLocalIp(),
      taskException: errorMsg,
    });
  }
}
