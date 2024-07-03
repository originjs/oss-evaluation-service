import { fetchWithTimeout } from '../../../integration/util/fetchWitTimeout';
import { Result } from '../../result';

export async function fetchRedirectUrl(url) {
  const response = fetchWithTimeout(url, {
    method: 'HEAD',
    redirect: 'follow',
  });

  if (response.ok) {
    return Result.ok({ redirect: response.redirected, url: response.url });
  } else if (response.status === 404) {
    return Result.fail(`url:{${url}} 404 ,it may be an invalid repo or a private repo.`);
  } else {
    return Result.fail(await response.text());
  }
}
