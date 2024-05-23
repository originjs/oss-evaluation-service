import { JobConfig } from './config.js';
import { Cron } from 'croner';
import { syncAllProjectCncfDocumentScore } from '../controllers/documentScore.js';
import { syncAllProjectCompassMetric } from '../controllers/compass.js';
import { sleep } from '../util/util.js';
import { logger } from '@orginjs/oss-evaluation-data-model';

// Strategy design pattern
class TimerTaskStrategy {
  execute() {
    throw new Error('TimerTaskStrategy.execute() must be implemented.');
  }
}

// Cncf Integration Timer
class CncfDocumentScoreTimer extends TimerTaskStrategy {
  #start = 0;
  execute(pattern) {
    // Task 1 的具体逻辑
    const documentScoreIntegrateJob = new Cron(pattern, { timezone: 'Etc/UTC' }, async () => {
      try {
        await syncAllProjectCncfDocumentScore({ startIndex: this.#start });
      } catch (err) {
        const { error, startIndex } = err;
        this.#start = startIndex;
        await sleep(10000);
        await documentScoreIntegrateJob.trigger();
        console.log(error);
      }
    });
  }
}

// Compass Integration Timer
class CompassTimer extends TimerTaskStrategy {
  #start = 0;
  #beginDate = '2023-04-01';
  execute(pattern) {
    const compassIntegrateJob = new Cron(pattern, { timezone: 'Etc/UTC' }, async () => {
      logger.info('[Integration][Compass] Compass Integration Job start');
      let startTime = process.hrtime();
      try {
        await syncAllProjectCompassMetric({ startIndex: this.#start, beginDate: this.#beginDate });
        logger.info('[Integration][Compass] Compass integration Successful!');
      } catch (err) {
        if (Object.prototype.hasOwnProperty.call(err, 'startIndex')) {
          const { error, startIndex } = err;
          this.#start = startIndex;
          if (
            Object.prototype.hasOwnProperty.call(error, 'response') &&
            error.response.status === 429
          ) {
            logger.error(
              `Compass integrates flow limiting, waits 1 hour and restarts the timer, and current process: ${startIndex}`,
            );
            await sleep(3600000);
            await compassIntegrateJob.trigger();
          } else {
            logger.error('Unknown error occurs, wait 10s and re-execute');
            await sleep(10000);
            await compassIntegrateJob.trigger();
          }
        } else if (
          Object.prototype.hasOwnProperty.call(err, 'name') &&
          err.name.includes('Sequelize')
        ) {
          logger.error('Sequelize error, please check your database config');
        }
      }
      let endTime = process.hrtime(startTime);
      logger.info(
        `[Integration][Compass] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
      );
    });
  }
}

// Scheduler Task Factory Mode
class TimerTaskFactory {
  static getTask(taskName) {
    switch (taskName) {
      case 'CncfDocumentScore':
        return new CncfDocumentScoreTimer();
      case 'Compass':
        return new CompassTimer();
      default:
        throw new Error(`Unknown Task with name: ${taskName}`);
    }
  }
}

// Execute all scheduled tasks
export default function scheduleJob() {
  logger.info('Schedule Integration Job');
  JobConfig.tasks
    .filter(taskConfig => taskConfig.enabled)
    .forEach(taskConfig => {
      const task = TimerTaskFactory.getTask(taskConfig.name);
      task.execute(taskConfig.scheduleTime);
    });
}
