export interface Param {
  gitOwner: string;
  repoName: string;
  language: string;
  id: number;
}

export interface SonarProjectInfo {
  sonarOrg: string;
  sonarKey: string;
  sonarHostUrl: string;
}

export interface GitCloneParam {
  owner: string;
  repoName: string;
  pullIfExists: boolean;
  sonarKey: string;
}

export type SonarScanParam = SonarProjectInfo & Param;
