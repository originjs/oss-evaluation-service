import { logger, ScheduleTaskMonitor } from '@orginjs/oss-evaluation-data-model';
import * as uuid from 'uuid';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
dayjs.extend(utc);

// Used for caching proxy objects
const taskMonitorCache = new Map();

/**
 * addMonitoringToTask
 *
 * @param {task} task task function
 * @param {string} taskName task name
 * @param {string} taskDesc task description
 * @returns {Proxy<*>} Proxy
 */
export function addMonitoringToTask(task, taskName, taskDesc) {
  if (!taskMonitorCache.has(taskName)) {
    // If the proxy object for the task is not found in the cache, create and cache it
    taskMonitorCache.set(taskName, createTaskMonitor(task, taskName, taskDesc));
  }
  // Return the cached proxy object
  return taskMonitorCache.get(taskName);
}

function createTaskMonitor(task, taskName, taskDesc) {
  return new Proxy(task, {
    async apply(target, thisArg, argumentsList) {
      // Generate a taskId using UUID
      const taskId = uuid.v4();
      await writeLog(taskId, taskName, taskDesc, '');
      logger.info(`task ${taskName} start execution`);
      try {
        const result = await Reflect.apply(target, thisArg, argumentsList);
        logger.info(`task ${taskName} execution success`);
        await writeLog(taskId, taskName, taskDesc, '');
        return result;
      } catch (error) {
        logger.error(`task ${taskName} execution failed : ${error.message}`);
        await writeLog(taskId, taskName, taskDesc, error.message);
      }
    },
  });
}

const taskStatus = Object.freeze({
  IN_PROGRESS: 0,
  SUCCESS: 1,
  FAILED: 2,
});

async function writeLog(taskId, taskName, taskDesc, errorMsg) {
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
      cron: '0 0 0 0 0 0',
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
      cron: '0 0 0 0 0 0',
      taskException: errorMsg,
    });
  }
}
