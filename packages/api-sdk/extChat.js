import { authorizationHeader } from './util.js';
import { logger } from '../data-model/index.js';

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 5;

export async function chat(data, token) {
  const headers = authorizationHeader(token);
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', '*/*');
  headers.append('Connection', 'keep-alive');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(process.env.EXT_AI_SERVICE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: data,
          response_mode: 'blocking',
          user: 'abc-123',
        }),
      });

      if (response.ok) {
        return response;
      }

      if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_RETRIES) {
        let waitMs = 1000 * Math.pow(2, attempt); // exponential backoff

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            const parsed = parseInt(retryAfter, 10);
            if (!isNaN(parsed)) {
              waitMs = parsed * 1000;
            } else {
              const retryDate = new Date(retryAfter);
              if (!isNaN(retryDate.getTime())) {
                waitMs = Math.max(retryDate.getTime() - Date.now(), 0) + 1000;
              }
            }
          }
        }

        logger.warn(
          `AI chat retryable status ${response.status}, attempt ${attempt + 1}/${MAX_RETRIES}, waiting ${waitMs}ms`,
        );
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      let bodyText;
      try {
        bodyText = await response.clone().text();
      } catch {
        bodyText = '(failed to read body)';
      }
      logger.error(`AI chat response failed! status=${response.status} ${bodyText}`);
      return response;
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        const waitMs = 1000 * Math.pow(2, attempt);
        logger.warn(
          `Fetch chat failed! Attempt ${attempt + 1}/${MAX_RETRIES}, retrying in ${waitMs}ms: ${e.message}`,
        );
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        logger.error(`Fetch chat failed! Retries exhausted: ${e.message}`);
        return { ok: false };
      }
    }
  }

  return { ok: false };
}
