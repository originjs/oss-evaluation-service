export interface SoftwareBaseInfo {
  id?: string;
  projectId?: string;
  projectName?: string;
  repoName: string;
  url: string;
  homePage: string;
  description: string;
  logo: string;
  star: number;
  fork: number;
  contributors: number;
  dependentRepositories: number;
  version?: string;
  versionList: string[];
  selectedVersion: string;
  selectedVersions: string[];
  forksCount: number;
}

export interface TechRadarItem {
  id?: string;
  label: string;
  link: string;
  quadrant: number; //象限顺时针从右下开始：0 语言; 1 框架; 2 库; 3 工具;
  ring: number; //圈从内到外：0 优选; 1 可选; 2 慎选; 3 禁选;
  moved: number;
}

export interface SoftwareInfo extends SoftwareBaseInfo {
  language: string;
  firstCommit: string;
  lastCommit: string;
  license: string;
  tags: string;
  codeLines: number;
  techStack: string;
  evaluation: {
    functionScore: number;
    qualityScore: number;
    performanceScore: number;
    ecologyScore: number;
    innovationScore: number;
    innovationValue: number;
    npmDownloads: number;
    stargazersCount: number;
    busFactor: number;
    openrank: number;
    criticalityScore: number;
    contributorCount: number;
    commitFrequency: number;
    commentFrequency: number;
    orgCount: number;
    updatedIssuesCount: number;
    closedIssuesCount: number;
    recentReleasesCount: number;
  };
  scorecard: {
    projectId: number;
    repoName: string;
    collectionDate: string;
    score: string | number;
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
    sonarProjectKey: string;
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
  projectTechStack: {
    radarRing: number;
  };
  satisfactionExport?: string;
  gzipSize?: number;
}

export type CompareProject = Pick<SoftwareInfo, 'repoName' | 'logo' | 'url' | 'description'>;

export interface EcologyActivity {
  projectId?: number;
  value: number;
  date: string;
}

export interface AlternativeInfo {
  id: number;
  repoName: string;
  logo: string;
  starCount: number;
  forksCount: number;
  url: string;
  description: string;
  ai: number;
}

export interface StarTrend {
  date: Array<string>;
  stargazers: Array<string>;
}

export interface EcologyActivityCategory {
  commitFrequency: EcologyActivity[];
  commentFrequency: EcologyActivity[];
  updatedIssuesCount: EcologyActivity[];
  closedIssuesCount: EcologyActivity[];
  orgCount: EcologyActivity[];
  contributorCount: EcologyActivity[];
  recentReleasesCount: EcologyActivity[];
  packageDownload: EcologyActivity[];
  starTrend: StarTrend;
  alternatives: AlternativeInfo[];
}

export interface InnovationData {
  prCountries: {
    countryCode: string;
    creatorsNum: number;
    percentage: string;
  }[];
  issueCountries: {
    countryCode: string;
    creatorsNum: number;
    percentage: string;
  }[];
  starCountries: {
    countryCode: string;
    creatorsNum: number;
    percentage: string;
  }[];
}

export interface BenchmarkData {
  base: { indexCategory: string; indexName: string; bestVal: number }[];
  data: {
    displayName: string;
    indexName: string;
    unit: string;
    description?: string;
    indexCategory?: string;
    rawValue?: string;
  }[][];
}

export interface PerformanceInfo {
  size: number;
  packageName: string;
  gzipSize: number;
  benchmarkScore: number;
  benchmarkData?: BenchmarkData;
}

export interface BenchmarkResult {
  projectId: string;
  projectName: string;
  displayName: string;
  benchmark: string;
  rawValue: number;
  createdAt: string;
  content: string;
  platform: string;
  version: string;
  envInfo: string;
  score: number;
  fullName: string;
}

export interface BenchmarkIndex {
  indexName: string;
  displayName: string;
  unit: string;
  category?: string;
  description?: string;
  order?: number;
  techStack?: string;
}

export interface InnovationCompaniesInfo {
  projectId: number;
  orgName: string;
  creatorsNum: number;
  percentage: number;
}

export interface InnovationTableInfo {
  ownerName: string;
  star: number;
}

export interface DependentProject {
  fullName: string;
  ownerName: string;
  ownerType: string;
  star: number;
}

export interface CompaniesInfo {
  stargazers: Array<InnovationCompaniesInfo>;
  issueCreators: Array<InnovationCompaniesInfo>;
  prCreators: Array<InnovationCompaniesInfo>;
}

export interface InnovationInfo {
  organizationInfo: {
    dependentProject: Array<DependentProject>;
    dependentOrganization: Array<InnovationTableInfo>;
  };
  companiesInfo: CompaniesInfo;
}

export interface SummaryHighlightInfo {
  alternativeProjects: Array<AlternativeInfo>;
  topPrCompanies: Array<InnovationCompaniesInfo>;
}

export interface NewProjectApply {
  repoUrl?: string;
  comment?: string;
  applicantEmail: string;
  username?: string;
  alternativeProjectId?: string;
  type: number;
  expandField1?: string;
  createdAt?: Date;
  techStack?: string;
  employeeNumber?: string;
  subTechStack?: string;
  filename?: string;
  file?: File;
  envInfo?: string;
}
