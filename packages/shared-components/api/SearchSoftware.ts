import HttpRequest from './HttpRequest';

import type { SoftwareBaseInfo, TechRadarItem } from '@orginjs/oss-evaluation-api-server';
export { SoftwareBaseInfo, TechRadarItem };

export function getSoftwareBaseInfoApi(params: { keyword: string; techStack?: string }) {
  return HttpRequest.get<SoftwareBaseInfo[]>(`/home/search`, {
    params,
  });
}

export function getTechRadarApi() {
  return HttpRequest.get<TechRadarItem[]>(`/home/radar`);
}
