import type { SimpleGit, SimpleGitOptions } from 'simple-git';
import { simpleGit } from 'simple-git';
import type { SonarScanParam } from '../interfaces/RepoInfo';
import { existsSync, mkdirSync } from 'fs';
import * as process from 'node:process';
import shelljs from 'shelljs';

export async function scan(info: SonarScanParam) {
  const owner = info.gitOwner;
  const repoName = info.repoName;
  const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
  await cloneRepoIfNotExist(owner, repoName, true);

  // run sonar
  shelljs.cd(dir);
  shelljs.exec(
    // eslint-disable-next-line max-len
    `sonar-scanner\
       -Dsonar.organization=${info.sonarOrg}\
       -Dsonar.projectKey=${info.sonarKey}\
       -Dsonar.sources=.\
       -Dsonar.host.url=${info.sonarHostUrl}`,
  );
  return true;
}

export async function getDefaultBranch(owner: string, repoName: string) {
  const gitClient = await cloneRepoIfNotExist(owner, repoName, false);
  const branchSummary = await gitClient.branch();
  const branchInfos = branchSummary.branches;
  const branchNames = new Set(Object.keys(branchInfos));
  //   if it contains main/master,return main/master
  if (branchNames.has('main')) {
    return 'main';
  } else if (branchNames.has('master')) {
    return 'master';
  } else {
    //   return the default branch
    return Object.values(branchInfos).filter(branch => branch.current)[0].name;
  }
}

export async function cloneRepoIfNotExist(owner: string, repoName: string, pullIfExists: boolean) {
  const dir = `${process.env.REPO_DIR}/${owner}/${repoName}`;
  const useGhProxy = JSON.parse(process.env.GH_PROXY ?? 'false');
  const gitHtmlUrl = getGitHtmlUrl(owner, repoName);
  const gitCloneUrl = getGitCloneUrl(owner, repoName);
  const cloneUrl = useGhProxy ? `https://mirror.ghproxy.com/${gitHtmlUrl}` : gitCloneUrl;
  const options: Partial<SimpleGitOptions> = {
    baseDir: dir,
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  };
  const exists = existsSync(dir);
  if (!exists) {
    mkdirSync(dir, { recursive: true });
  }
  const gitClient: SimpleGit = simpleGit(options);
  const isRepo = await gitClient.checkIsRepo();
  if (isRepo) {
    console.log(`${owner}/${repoName} exists`);
    if (pullIfExists) {
      await gitClient.pull();
    }
  } else {
    console.log(`${owner}/${repoName} dont exists,git clone`);
    await gitClient.clone(cloneUrl, '.');
  }
  return gitClient;
}

function getGitHtmlUrl(owner: string, repoName: string) {
  return `https://github.com/${owner}/${repoName}`;
}

function getGitCloneUrl(owner: string, repoName: string) {
  return `https://github.com/${owner}/${repoName}.git`;
}
