export interface RepoInfo {
  gitOwner: string;
  repoName: string;
  cloneUrl: string;
  gitHtmlUrl: string;
}

export interface SonarProjectInfo {
  sonarOrg: string;
  sonarKey: string;
  sonarHostUrl: string;
}

export type SonarScanParam = SonarProjectInfo & RepoInfo;
