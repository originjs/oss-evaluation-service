import { Cron } from 'croner';
import debug from 'debug';
import { sleep } from '../util/util.js';
import { syncAllProjectCompassMetric } from './compass.js';

const integrationTime = '@weekly';
let start = 0;

const compassIntegrateJob = new Cron(integrationTime, { timezone: 'Etc/UTC' }, async () => {
  debug.log('compass integration start!', compassIntegrateJob.getPattern());
  try {
    await syncAllProjectCompassMetric({ startIndex: start, beginDate: '2023-11-01' });
    debug.log('Synchronous compass successful!');
  } catch (err) {
    if (err.name === 'SequelizeConnectionError') {
      debug.log('An Sequelize error occurred');
    } else {
      const { error, startIndex } = err;
      start = startIndex;
      debug.log(error);
      if (
        Object.prototype.hasOwnProperty.call(error, 'response') &&
        error.response.status === 429
      ) {
        debug.log('The server returns 429 rate limit, try again after one hour.');
        await sleep(3600000);
        await compassIntegrateJob.trigger();
      } else {
        debug.log('An error occurred, start trying again');
        await sleep(10000);
        await compassIntegrateJob.trigger();
      }
    }
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function schedule() {
  if (process.env.ENVIRONMENT === 'production') {
    await compassIntegrateJob.trigger();
  }
}
