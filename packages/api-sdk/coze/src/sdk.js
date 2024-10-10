import { chat } from './chat.js';

export class CozeSdk {
  static ALTERNATIVE_BOT = '7371714000902045712';
  static CLASSIFICATION_BOT = '7423745045569781778';

  constructor(bot, token) {
    this.bot = bot;
    token = token || process.env.COZE_API_TOKEN;
    this.token = token;
  }

  chat = query => {
    return chat(query, this.token, this.bot);
  };
}
