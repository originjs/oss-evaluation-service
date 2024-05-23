import { authorizationHeader } from '../../util.js';

export function chat(query, token) {
  const headers = authorizationHeader(token);
  headers.append('Content-Type', 'application/json');
  headers.append('Accept', '*/*');
  headers.append('Host', 'api.coze.com');
  headers.append('Connection', 'keep-alive');
  return fetch(`https://api.coze.com/open_api/v2/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      bot_id: '7371714000902045712',
      //bot_id: '7372168213741764619',
      user: 'oss-evaluation',
      query,
      stream: false,
    }),
  });
}
