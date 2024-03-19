import HttpRequest from '@api/HttpRequest';

type BaseInfo = {
  logo: string;
  url: string;
  description: string;
  tags: string;
  star: number;
  fork: number;
  language: string;
  codeLines: number;
  firstCommit: string;
  license: string;
  evaluation: {
    functionScore: number;
    qualityScore: number;
    performanceScore: number;
    ecologyScore: number;
    innovationValue: number;
  };
};

export function getBaseInfo(repoName: string) {
  return HttpRequest.get<BaseInfo>(`/softwareDetail/overview/${repoName}`);
}

type functionModuleInfo = {
  satisfaction: {
    xAxis: Array<number>;
    yAxis: Array<number>;
  };
  document: {
    documentScore: number;
    hasReadme: boolean;
    hasChangelog: boolean;
    hasWebsite: boolean;
    hasContributing: boolean;
  };
};

export function getFunctionModuleInfo(repoName: string) {
  return HttpRequest.get<functionModuleInfo>(`/softwareDetail/function/${repoName}`);
}

export type BenchmarkData = {
  displayName: string;
  indexName: string;
  rawValue: null | string;
}[][];

export type PerformanceModuleInfo = {
  size: number;
  gzipSize: number;
  benchmarkScore: number;
  benchmarkData: BenchmarkData;
};

export function getPerformanceModuleInfo(repoName: string) {
  return HttpRequest.get<PerformanceModuleInfo>(`/softwareDetail/performance/${repoName}`);
}

type QualityModuleInfo = {
  scorecard: {
    score: number;
    maintained: number;
    codeReview: number;
    ciiBestPractices: number;
    license: number;
    branchProtection: number;
    securityPolicy: number;
    dangerousWorkflow: number;
    tokenPermissions: number;
    binaryArtifacts: number;
    fuzzing: number;
    sast: number;
    pinnedDependencies: number;
    vulnerabilities: number;
  };
};

export function getQualityModuleInfo(repoName: string) {
  return HttpRequest.get<QualityModuleInfo>(`/softwareDetail/quality/${repoName}`);
}

export type EcologyOverview = {
  name: string;
  fullName: string;
  downloads: number;
  stargazersCount: number;
  busFactor: number;
  openRank: number;
  criticalityScore: number;
  contributorCount: number;
  dependentCount: number;
  forksCount: number;
};

export function getEcologyOverviewApi(repoName: string) {
  return HttpRequest.get<EcologyOverview>(`/ecology/overview/${repoName}`);
}

export type EcologyActivity = {
  projectId: number;
  value: number;
  date: string;
};

export type EcologyActivityCategory = {
  commitFrequency: EcologyActivity[];
  commentFrequency: EcologyActivity[];
  updatedIssuesCount: EcologyActivity[];
  closedIssuesCount: EcologyActivity[];
  orgCount: EcologyActivity[];
  contributorCount: EcologyActivity[];
};

export function getEcologyActivityCategoryApi(repoName: string) {
  return HttpRequest.get<EcologyActivityCategory>(`/ecology/activity/${repoName}`);
}

export function exportFileApi(repoName: string) {
  return HttpRequest.post<Blob>(`/ecology/export/${repoName}`, undefined, { responseType: 'blob' });
}
