import { authorizationHeader } from './util.js';
import { logger } from '../data-model/index.js';

export async function chat(data, token) {
  const headers = authorizationHeader(token);
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', '*/*');
  headers.append('Connection', 'keep-alive');
  let response = { ok: false };
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
      if (!response.ok) {
        logger.error(`AI chat response failed! \n${JSON.stringify(await response.json())}`);
      }
      retryCount = -1;
    } catch (e) {
      retryCount++;
      logger.error(`Fetch chat failed! Retry count: ${retryCount}\n`, `${data.GithubUrl}\n`, e);
    }
  }
  return response;
}
