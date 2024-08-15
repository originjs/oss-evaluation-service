import { JobConfig } from './config.js';
import { logger } from '@orginjs/oss-evaluation-data-model';
import { cncfDocumentScoreTimer } from '../controllers/documentScore.js';
import Cron from 'croner';
import { compassTimer } from '../controllers/compass.js';
import { packageDownloadCountTimer } from '../controllers/downloadCount.js';
import { projectDependentCountTimer } from '../controllers/projectDependentCount.js';
import { projectCodeSizeTimer } from '../controllers/projectCodeSize.js';
import { projectContributorsTimer } from '../controllers/projectContributors.js';
import { evaluateTimer, evaluateHistoryTimer } from '../controllers/evaluate.js';

function createTimer(name, pattern, timer) {
  if (!pattern) {
    logger.error('job pattern undefined error, Please Check validity');
    return;
  }
  return new Cron(
    pattern,
    {
      name,
      timezone: 'Etc/UTC',
      catch: err => {
        logger.error(err); // only logging error
      },
    },
    async function () {
      timer();
    },
  );
}

// Abstract Factory + Scheduler
const taskFactory = {
  // To add a timed task, add the timed function name below and in the configuration file
  cncfDocumentScoreTimer,
  compassTimer,
  packageDownloadCountTimer,
  projectCodeSizeTimer,
  projectDependentCountTimer,
  projectContributorsTimer,
  evaluateTimer,
  evaluateHistoryTimer,
  createTask: function (taskName) {
    if (!this[taskName]) {
      throw new Error(`Task ${taskName} not found`);
    }
    return this[taskName];
  },
};

// Execute all scheduled tasks
export default function scheduleJob() {
  logger.info('Schedule Integration Job');
  JobConfig.tasks
    .filter(config => config.enabled)
    .forEach(config => {
      const taskFunction = taskFactory.createTask(config.name);
      const job = createTimer(config.name, config.cronScheduleTime, taskFunction);
      logger.info(`Integration Job [${job.name}] Start At Cron Expression : ${job.getPattern()}`);
    });
}
