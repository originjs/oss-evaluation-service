export interface RepoInfo {
  gitOwner: string;
  repoName: string;
  language: string;
}

export interface SonarProjectInfo {
  sonarOrg: string;
  sonarKey: string;
  sonarHostUrl: string;
}

export type SonarScanParam = SonarProjectInfo & RepoInfo;
