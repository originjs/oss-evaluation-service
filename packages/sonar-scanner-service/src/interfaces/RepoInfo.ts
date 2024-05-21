export interface RepoInfo {
  gitOwner: string;
  repoName: string;
}

export interface SonarProjectInfo {
  sonarOrg: string;
  sonarKey: string;
  sonarHostUrl: string;
}

export type SonarScanParam = SonarProjectInfo & RepoInfo;
