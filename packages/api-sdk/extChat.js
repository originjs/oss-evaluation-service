import { authorizationHeader } from './util.js';

export function chat(data, token) {
  const headers = authorizationHeader(token);
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', '*/*');
  headers.append('Connection', 'keep-alive');
  return fetch(process.env.EXT_AI_SERVICE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: data,
      response_mode: 'blocking',
      user: 'abc-123',
    }),
  });
}
