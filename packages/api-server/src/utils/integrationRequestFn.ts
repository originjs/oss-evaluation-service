import { ProxyAgent } from 'undici';

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const requestOpts: RequestInit = {
  method: 'GET',
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  },
};
const proxyUrl = process.env.PROXY_URL;
if (proxyUrl) {
  // @ts-expect-error no need handle
  requestOpts.dispatcher = new ProxyAgent(proxyUrl);
}
export const requestFn = async (urlParam: string, arr: unknown[]) => {
  if (!process.env.INTEGRATION_URL) {
    throw new Error('no env named {INTEGRATION_URL} , skip import');
  }
  for (const obj of arr) {
    const url = new URL(urlParam);
    Object.getOwnPropertyNames(obj).forEach(key => {
      url.searchParams.append(key, obj[key]);
    });
    const importResponse = await fetch(url.href, requestOpts);
    if (!importResponse.ok) {
      throw new Error(`call api failed ${url.href}! , ${await importResponse.text()}`);
    }
    await sleep(1000);
  }
};
