export interface GitRepoInfo {
  owner: string;
  repoName: string;
  platformType?: string;
  language?: string;
  pId?: number;
  cloneUrl?: string;
  fullName?: string;
}

export interface SonarProjectInfo {
  sonarOrg?: string;
  sonarKey?: string;
  sonarHostUrl?: string;
  sonarToken?: string;
}

export interface CloneConfig {
  pullIfExists?: boolean;
  shadowClone?: boolean;
}

export type SonarScanParam = SonarProjectInfo & GitRepoInfo & CloneConfig;

export type RepoCloneParam = GitRepoInfo & CloneConfig;
