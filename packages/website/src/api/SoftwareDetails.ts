import HttpRequest from '@api/HttpRequest';

type BaseInfo = {
  logo: string;
  description: string;
  tags: string;
  star: number;
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
  return HttpRequest.get<BaseInfo>(`/api/softwareDetail/overview/${repoName}`);
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
  return HttpRequest.get<functionModuleInfo>(`/api/softwareDetail/function/${repoName}`);
}

type PerformanceModuleInfo = {
  size: number;
  gzipSize: number;
  benchmarkScore: number;
};

export function getPerformanceModuleInfo(repoName: string) {
  return HttpRequest.get<PerformanceModuleInfo>(`/api/softwareDetail/performance/${repoName}`);
}

type QualityModuleInfo = {
  scorecard: {
    score: number;
    maintained: number;
    codeReview: number;
    ciiBestPractices: number;
    license: number;
    branchProtection: number;
  };
};

export function getQualityModuleInfo(repoName: string) {
  return HttpRequest.get<QualityModuleInfo>(`/api/softwareDetail/quality/${repoName}`);
}
