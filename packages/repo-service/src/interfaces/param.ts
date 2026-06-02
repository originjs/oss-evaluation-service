export interface GitRepoInfo {
  owner: string;
  repoName: string;
  platformType?: number;
  language?: string;
  pId?: string;
  cloneUrl?: string;
  fullName?: string;
}


export interface CloneConfig {
  pullIfExists?: boolean;
  shadowClone?: boolean;
}


export type RepoCloneParam = GitRepoInfo & CloneConfig;
