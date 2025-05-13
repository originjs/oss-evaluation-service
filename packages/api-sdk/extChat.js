import { authorizationHeader } from './util.js';
import { logger } from '../data-model/index.js';

export async function chat(data, token) {
  const headers = authorizationHeader(token);
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', '*/*');
  headers.append('Connection', 'keep-alive');
  let response;
  let retryCount = 0;
  while (retryCount !== -1 && retryCount < 5) {
    try {
      response = await fetch(process.env.EXT_AI_SERVICE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: data,
          response_mode: 'blocking',
          user: 'abc-123',
        }),
      });
      retryCount = -1;
    } catch (e) {
      retryCount++;
      if (retryCount === 5) {
        throw e;
      }
      logger.error(`Fetch chat failed! Retry count: ${retryCount}\n`, e);
    }
  }
  return response;
}
