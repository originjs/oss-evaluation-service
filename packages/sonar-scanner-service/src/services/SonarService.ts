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
  const useGhProxy = JSON.parse(process.env.GH_PROXY ?? 'false');
  const cloneUrl = useGhProxy ? `https://mirror.ghproxy.com/${info.gitHtmlUrl}` : info.cloneUrl;
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
  const git: SimpleGit = simpleGit(options);
  const isRepo = await git.checkIsRepo();
  if (isRepo) {
    console.log(`${owner}/${repoName} exists,git pull`);
    await git.pull();
  } else {
    console.log(`${owner}/${repoName} dont exists,git clone`);
    await git.clone(cloneUrl, '.');
  }

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
