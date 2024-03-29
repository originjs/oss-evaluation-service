export interface SoftwareBaseInfo {
  repoName: string;
  url: string;
  description: string;
  logo: string;
  star?: number;
}

export interface EcologyOverview {
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
}

export interface SoftwareInfo extends SoftwareBaseInfo {
  fork: number;
  language: string;
  firstCommit: string;
  license: string;
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
    reliabilityRating: string;
    maintainabilityRating: string;
    securityRating: string;
    securityReviewRating: string;
  };
  document: {
    documentScore: number;
    hasReadme: boolean;
    hasChangelog: boolean;
    hasWebsite: boolean;
    hasContributing: boolean;
  };
  satisfaction: {
    year: number;
    val: number;
  }[];
  ecologyOverview: EcologyOverview;
}

export interface EcologyActivity {
  projectId: number;
  value: number;
  date: string;
}

export interface EcologyActivityCategory {
  commitFrequency: EcologyActivity[];
  commentFrequency: EcologyActivity[];
  updatedIssuesCount: EcologyActivity[];
  closedIssuesCount: EcologyActivity[];
  orgCount: EcologyActivity[];
  contributorCount: EcologyActivity[];
}

export interface BenchmarkData {
  base: { indexName: string; bestVal: number }[];
  data: {
    displayName: string;
    indexName: string;
    rawValue: null | string;
  }[][];
}

export interface PerformanceInfo {
  size: number;
  packageName: string;
  gzipSize: number;
  benchmarkScore: number;
  benchmarkData?: BenchmarkData;
}
