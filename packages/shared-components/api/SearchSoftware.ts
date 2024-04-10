import HttpRequest from './HttpRequest';

import type { SoftwareBaseInfo } from '@orginjs/oss-evaluation-api-server';
export { SoftwareBaseInfo };

export function getSoftwareBaseInfoApi(params: { keyword: string; techStack?: string }) {
  return HttpRequest.get<SoftwareBaseInfo[]>(`/home/search`, {
    params,
  });
}
