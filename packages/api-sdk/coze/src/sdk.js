import { chat } from './chat.js';

export class CozeSdk {
  constructor(token) {
    token = token || process.env.COZE_API_TOKEN;
    this.token = token;
  }

  chat = query => {
    return chat(query, this.token);
  };
}
