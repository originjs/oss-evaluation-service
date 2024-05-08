import HttpRequest from './HttpRequest';
import type {
  SoftwareInfo,
  SoftwareBaseInfo,
  PerformanceInfo,
  BenchmarkData,
  EcologyActivityCategory,
  EcologyActivity,
} from '@orginjs/oss-evaluation-api-server';

export {
  SoftwareInfo,
  SoftwareBaseInfo,
  PerformanceInfo,
  BenchmarkData,
  EcologyActivity,
  EcologyActivityCategory,
};

export function getSoftwareInfo(repoName: string) {
  return HttpRequest.get<SoftwareInfo>(`/project/${repoName}`);
}

export function getEcologyActivityCategoryApi(repoName: string) {
  return HttpRequest.get<EcologyActivityCategory>(`/project/activity/${repoName}`);
}

export function exportFileApi(repoName: string) {
  return HttpRequest.post<Blob>(`/project/export/${repoName}`, undefined, { responseType: 'blob' });
}
