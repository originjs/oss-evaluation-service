import { JobConfig } from './config.js';
import { Cron } from 'croner';
import { syncAllProjectCncfDocumentScore } from '../controllers/documentScore.js';
import { syncAllProjectCompassMetric } from '../controllers/compass.js';
import { sleep } from '../util/util.js';

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
  async execute(pattern) {
    const compassIntegrateJob = new Cron(pattern, { timezone: 'Etc/UTC' }, async () => {
      try {
        await syncAllProjectCompassMetric({ startIndex: this.#start, beginDate: '2023-11-01' });
      } catch (err) {
        if (err.name.includes('Sequelize')) {
          console.log(err);
        } else {
          const { error, startIndex } = err;
          this.#start = startIndex;
          if (
            Object.prototype.hasOwnProperty.call(error, 'response') &&
            error.response.status === 429
          ) {
            await sleep(3600000);
            await compassIntegrateJob.trigger();
          } else {
            await sleep(10000);
            await compassIntegrateJob.trigger();
          }
        }
      }
    });
    return compassIntegrateJob;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function scheduleJob() {
  JobConfig.tasks.forEach(taskConfig => {
    const task = TimerTaskFactory.getTask(taskConfig.name);
    task.execute(taskConfig.scheduleTime);
  });
}
