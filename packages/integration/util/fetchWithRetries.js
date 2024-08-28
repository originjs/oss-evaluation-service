import { logger } from '@orginjs/oss-evaluation-data-model';
import { sleep } from './util.js';

export async function fetchWithRetries(url, options = {}, attempts = 3) {
  if (typeof options === 'number') {
    attempts = options;
    options = {};
  }
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return response;
    } catch (error) {
      logger.error('Error fetching data:', error);
      if (i < attempts - 1) {
        await sleep(5000);
        logger.info(`Retrying... Attempts: ${i + 1}`);
      } else {
        throw new Error('Max retry attempts exceeded');
      }
    }
  }
}
