import { logger } from '@orginjs/oss-evaluation-data-model';

export async function fetchWithRetries(url, options = {}, attempts = 3) {
  if (typeof options === 'number') {
    attempts = options;
    options = {};
  }
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return response;
  } catch (error) {
    logger.error('Error fetching data:', error);
    if (attempts > 0) {
      logger.info(`Retrying... Attempts left: ${attempts}`);
      return fetchWithRetries(url, options, attempts - 1);
    } else {
      throw new Error('Max retry attempts exceeded');
    }
  }
}
