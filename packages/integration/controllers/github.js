import debug from 'debug';
import https from 'node:https';
import * as fs from 'node:fs';
import { Octokit } from '@octokit/core';
import GithubProjects from '../models/GithubProjects.js';

/**
 *  There are 952 github projects between 1000 and 1130 stars.
 *  There are 968 github projects between 1131 and 1290 stars.
 *  There are 967 github projects between 1291 and 1480 stars.
 *  There are 922 github projects between 1481 and 1700 stars.
 *  There are 926 github projects between 1701 and 2000 stars.
 *  There are 955 github projects between 2001 and 2500 stars.
 *  There are 960 github projects between 2501 and 3200 stars.
 *  There are 943 github projects between 3201 and 4390 stars.
 *  There are 954 github projects between 4391 and 7000 stars.
 *  There are 955 github projects between 7001 and 16000 stars.
 *  There are 524 github projects by stars:>=16001.
 */
export async function observeProjectsByStar(req, res) {
  const githubApiUrl = getGithubApiUrl(req);
  const result = await pagingQuery(githubApiUrl);

  const message = `There are ${result.totalCount} github projects by ${getStarsScope(req)}.`;
  res.status(200).send(message);
}

export async function syncProjectByStar(req, res) {
  const githubApiUrl = getGithubApiUrl(req);
  let result;
  let projects = [];

  do {
    result = await pagingQuery(result?.nextPageUrl || githubApiUrl);
    projects = projects.concat(result.data);
  } while (result.hasNext);

  const csvFileName = `projects_stars_${req.body[0]}_${req.body[1] || 'above'}`;
  saveCSVFile(projects, csvFileName);
  savaData(projects);

  const message = `Synchronize star ${getStarsScope(req)} github projects for success,total ${projects.length} rows`;
  res.status(200).send(message);
}

export async function syncProjectByUserStar(req, res) {
  if (!req.params?.userToken) {
    res.status(500).json({ error: 'User token is required.' });
    return;
  }

  const octokit = new Octokit({
    auth: req.params.userToken,
  });

  let i = 0;
  while (true) {
    i += 1;
    const response = await octokit.request('GET /user/starred', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      per_page: 100,
      page: i,
    });
    if (!response.data.length) {
      break;
    }
    const projects = parseProjects(response.data);
    for (let j = 0; j < projects.length; j += 1) {
      projects[j].integratedState = 1;
    }

    saveCSVFile(projects, `github_projects_user_star_page${i}`);
    savaData(projects);
  }

  res.status(200).json('success');
}

function getGithubApiUrl(req) {
  const param = getStarsScope(req);
  return `https://api.github.com/search/repositories?q=language:javascript+language:typescript+${param}&sort=stars&order=asc&per_page=100`;
}

function getStarsScope(req) {
  if (!req.body[1]) {
    return `stars:>=${req.body[0]}`;
  }
  return `stars:${req.body[0]}..${req.body[1]}`;
}

async function savaData(projects) {
  const updateOnDuplicate = Object.keys(projects[0]).slice(1);
  const result = await GithubProjects.bulkCreate(projects, {
    updateOnDuplicate,
  });
  console.log(`Batch insert/update success,${result.length} rows.`);
}

function saveCSVFile(projects, fileName) {
  let csv = Object.keys(projects[0]).join(',');
  csv += '\n';
  csv += projects.map((row) => Object.values(row).join(',')).join('\n');

  if (!fs.existsSync('github_projects')) {
    fs.mkdirSync('github_projects');
  }

  const filePath = `github_projects/${fileName}_${Date.now()}.csv`;
  fs.writeFileSync(filePath, csv, 'utf8');
}

async function pagingQuery(url) {
  const headers = { 'User-Agent': 'nodejs/18.19.0' };
  if (process.env.GITHUB_TOKEN) {
    const tokens = JSON.parse(process.env.GITHUB_TOKEN);
    [headers.Authorization] = tokens;
    headers['X-GitHub-Api-Version'] = '2022-11-28';
    headers.Accept = 'application/vnd.github+json';
  }

  return new Promise((resolve) => {
    https
      .get(url, { headers, timeout: 60000 }, (res) => {
        let result = Buffer.from('');
        res.on('data', (d) => {
          result = Buffer.concat([result, d], result.length + d.length);
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            res.status(500).json(result.toString());
            resolve({ hasNext: false, nextPageUrl: '', data: [] });
          }
          const links = parseLinks(res.headers.link);
          const resultBody = JSON.parse(result.toString());
          console.log(`Integrate the total rows of records: ${resultBody.total_count},Rows of this integration:${resultBody.items.length}`);

          const projects = parseProjects(resultBody.items);
          resolve({
            hasNext: !!links.next,
            nextPageUrl: links.next,
            data: projects,
            totalCount: resultBody.total_count,
          });
        });
      })
      .on('error', (e) => {
        debug.log(e);
        resolve({
          hasNext: false,
          nextPageUrl: '',
          data: [],
          totalCount: 0,
        });
      });
  });
}

function parseProjects(items) {
  return items.map((project) => ({
    id: project.id,
    name: project.name,
    fullName: project.full_name,
    htmlUrl: project.html_url,
    description: project.description,
    privateFlag: project.private,
    ownerName: project.owner.login,
    forkFlag: project.fork,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    pushedAt: project.pushed_at,
    gitUrl: project.git_url,
    cloneUrl: project.clone_url,
    size: project.size,
    stargazersCount: project.stargazers_count,
    watchersCount: project.watchers_count,
    language: project.language,
    hasIssues: project.has_issues,
    forksCount: project.forks_count,
    archived: project.archived,
    disabled: project.disabled,
    openIssuesCount: project.open_Issues_count,
    license: project.license?.key,
    allowForking: project.allow_forking,
    topics: project.topics?.join('|'),
    visibility: project.visibility,
    forks: project.forks,
    openIssues: project.open_issues,
    watchers: project.watchers,
    defaultBranch: project.default_branch,
    ownerAvatarUrl: project.owner?.avatar_url,
    ownerType: project.owner?.type,
    ownerId: project.owner?.id,
    ownerHtmlUrl: project.owner?.html_url,
    sshUrl: project.ssh_url,
    svnUrl: project.svn_url,
    homePage: project.homepage,
    hasProjects: project.has_projects,
    hasDownloads: project.has_downloads,
    hasWiki: project.has_wiki,
    hasPages: project.has_pages,
    hasDiscussions: project.has_discussions,
    mirrorUrl: project.mirror_url,
    licenseName: project.license?.name,
    isTemplate: project.is_template,
    webCommitSignoffRequired: project.web_commit_signoff_required,
  }));
}
export async function syncProjectByRepo(req, res) {
  if (!process.env.GITHUB_TOKEN) {
    res.status(500).json({ error: 'User token is required.' });
    return;
  }

  const items = [];
  for (const projectUrl of req.body) {
    const item = await queryProjectByRepUrl(projectUrl);
    if (item) items.push(item);
  }

  if (!items.length) {
    res.status(200).json('success');
    return;
  }

  const projects = parseProjects(items);
  saveCSVFile(projects, 'github_projects');
  await savaData(projects);

  res.status(200).json('success');
}

async function queryProjectByRepUrl(url) {
  const ownerRepo = getOwnerRepo(url);
  if (!ownerRepo) {
    debug.log('Url must be the github address,eg:https://github.com/vuejs/core');
    return null;
  }

  const tokens = JSON.parse(process.env.GITHUB_TOKEN);
  // const agent = new HttpsProxyAgent('http://127.0.0.1:8080');
  const response = await fetch(
    `https://api.github.com/repos/${ownerRepo[0]}/${ownerRepo[1]}`,
    {
      // agent,
      headers: {
        'User-Agent': 'nodejs/18.19.0',
        Authorization: tokens[0],
        'X-GitHub-Api-Version': '2022-11-28',
        Accept: 'application/vnd.github+json',
      },
    },
  );

  let project = null;
  if (response.ok) {
    project = await response.json();
  } else {
    debug.log(await response.text());
  }
  return project;
}

function getOwnerRepo(url) {
  const keyWords = 'github.com';
  const startIndex = url.indexOf(keyWords);
  const fullName = url.substr(startIndex + keyWords.length);
  const paths = fullName.split('/');
  if (paths.length < 2) {
    return null;
  }
  return paths.slice(paths.length - 2);
}

function parseLinks(linksStr) {
  const linksArray = linksStr.split(',');
  const links = {};
  let key;
  let value;
  linksArray.forEach((link) => {
    key = link.match(/rel="(.*)"/)?.[1];
    value = link.match(/<(.*?)>/)?.[1];
    if (!key) {
      return;
    }
    links[key] = value;
  });
  return links;
}
