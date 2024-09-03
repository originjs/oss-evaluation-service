import HttpRequest from './HttpRequest';
import type {
  SoftwareInfo,
  SoftwareBaseInfo,
  PerformanceInfo,
  BenchmarkData,
  EcologyActivityCategory,
  EcologyActivity,
  AlternativeInfo,
  StarTrend,
  InnovationInfo,
  InnovationData,
  InnovationTableInfo,
  InnovationCompaniesInfo,
  DependentProject,
  CompaniesInfo,
  CompareProject,
  NewProjectApply,
} from '@orginjs/oss-evaluation-api-server';

export {
  SoftwareInfo,
  SoftwareBaseInfo,
  PerformanceInfo,
  BenchmarkData,
  EcologyActivity,
  EcologyActivityCategory,
  AlternativeInfo,
  StarTrend,
  InnovationInfo,
  InnovationData,
  InnovationTableInfo,
  InnovationCompaniesInfo,
  DependentProject,
  CompaniesInfo,
  CompareProject,
  NewProjectApply,
};

export function getSoftwareInfo(repoName: string) {
  return HttpRequest.get<SoftwareInfo>(`/project/${repoName}`);
}

export function getPerformanceModuleInfo(repoName: string) {
  return HttpRequest.get<PerformanceInfo>(`/project/performance/${repoName}`);
}

export function getEcologyActivityCategoryApi(repoName: string) {
  return HttpRequest.get<EcologyActivityCategory>(`/project/activity/${repoName}`);
}

export function exportFileApi(repoName: string) {
  return HttpRequest.post<Blob>(`/project/export/${repoName}`, undefined, { responseType: 'blob' });
}

export function exportSoftwareCompareFileApi(repoNameList: string[]) {
  return HttpRequest.post<Blob>(`/project/compareExport`, repoNameList, { responseType: 'blob' });
}

export function getInnovationApi(repoName: string) {
  return HttpRequest.get<InnovationInfo>(`/project/innovation/${repoName}`);
}

export function getGeoDistributionInfo(repoName: string) {
  return HttpRequest.get<InnovationData>(`/project/innovate/${repoName}`);
}

export function submitApplication(param: NewProjectApply) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(param)) {
    formData.append(key, value);
  }

  return HttpRequest.post<string>('/newProjectApply/submitApplication', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function downloadExcelTemplate() {
  return HttpRequest.get<Blob>(`/benchmark/downloadExcelTemplate`, { responseType: 'blob' });
}
