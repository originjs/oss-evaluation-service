import HttpRequest from '@api/HttpRequest';

export interface SoftwareInfo {
  name: string;
  url: string;
  logo: string;
  star: number;
  fork: number;
  language: string;
  firstCommit: string;
  license: string;
  description: string;
  tags: string;
  codeLines: number;
  techStack: string;
  evaluation: {
    functionScore: number;
    qualityScore: number;
    performanceScore: number;
    ecologyScore: number;
    innovationValue: number;
  };
  scorecard: {
    projectId: number;
    repoName: string;
    collectionDate: string;
    score: number;
    commit: string;
    codeReview: number;
    maintained: number;
    ciiBestPractices: number;
    license: number;
    signedReleases: number;
    packaging: number;
    tokenPermissions: number;
    dangerousWorkflow: number;
    pinnedDependencies: number;
    branchProtection: number;
    binaryArtifacts: number;
    fuzzing: number;
    securityPolicy: number;
    sast: number;
    vulnerabilities: number;
  };
  sonarCloudScan: {
    bugs: number;
    codeSmells: number;
    vulnerabilities: number;
    securityHotspots: number;
    reviewed: string;
    reliabilityLevel: string;
    maintainabilityLevel: string;
    securityLevel: string;
    securityReviewLevel: string;
  };
  document: {
    documentScore: number;
    hasReadme: boolean;
    hasChangelog: boolean;
    hasWebsite: boolean;
    hasContributing: boolean;
  };
  satisfaction: [
    {
      year: number;
      val: number;
    },
    {
      year: number;
      val: number;
    },
    {
      year: number;
      val: number;
    },
  ];
  ecologyOverview: {
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
};

export type BaseInfo = {
  logo: string;
  url: string;
  description: string;
  tags: string;
  techStack: string;
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

export function getSoftwareInfo(repoName: string) {
  return HttpRequest.get<SoftwareInfo>(`/softwareDetail/softwareInfo/${repoName}`);
}

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
  sonar: {
    bugs: number,
    codeSmells: number,
    vulnerabilities: number,
    securityHotspots: number,
    securityHotspotsReviewed: string,
    reliabilityRating: string,
    maintainabilityRating: string,
    securityRating: string,
    securityReviewRating: string,
  };
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
