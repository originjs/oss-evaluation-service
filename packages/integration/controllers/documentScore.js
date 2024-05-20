import debug from 'debug';
import { Octokit } from '@octokit/core';
import { GithubProjects, CncfDocumentScore } from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';

// cncf document checks item
const cncfDocumentChecksSet = {
  readme: {
    id: 'readme',
    weight: 10,
    repoPattern: new RegExp(['readme*', '.github/readme*', 'docs/readme*'].join('|'), 'i'),
    checked: false,
    path: '',
  },
  changelog: {
    id: 'changelog',
    weight: 1,
    repoPattern: new RegExp(['changelog*'].join('|'), 'i'),
    readmePattern: new RegExp(
      [
        String.raw`^#+.*changelog.*$`,
        String.raw`^changelog$`,
        String.raw`\[.*changelog.*\]\(.*\)`,
      ].join('|'),
      'im',
    ),
    releasePattern: new RegExp(['changelog', 'changes'].join('|'), 'i'),
    checked: false,
    path: '',
  },
  contributing: {
    id: 'contributing',
    weight: 4,
    repoPattern: new RegExp(
      ['contributing*', '.github/contributing*', 'docs/contributing*'].join('|'),
      'i',
    ),
    readmePattern: new RegExp(
      [
        String.raw`^#+.*contributing.*$`,
        String.raw`^contributing$`,
        String.raw`\[.*contributing.*\]\(.*\)`,
      ].join('|'),
      'im',
    ),
    checked: false,
    path: '',
  },
  website: {
    id: 'website',
    weight: 4,
    checked: false,
    path: '',
  },
};

const BASIC_GITHUB_REPO_API = 'GET /repos/{owner}/{repo}';

export default async function syncProjectCncfDocumentScoreHandler(req, res) {
  const { repoUrl, startIndex } = req.body;
  const fullIntegration = repoUrl === undefined || repoUrl === null || repoUrl === '';

  if (fullIntegration) {
    await syncAllProjectCncfDocumentScore({ startIndex: startIndex });
    res.status(200).send('Full-scale CNCF document score integration success!');
  } else {
    const project = await getProjectByUrl(repoUrl);
    await syncSingleProjectCncfDocumentScore(project);
    res.status(200).json(`Project: ${repoUrl} integrating success!`);
  }
}

export async function syncSingleProjectCncfDocumentScore(project) {
  const documentProject = await CncfDocumentScore.findOne({
    where: { repoUrl: project.htmlUrl },
  });

  if (documentProject != null) {
    // update
    debug.log('Already calculate, update project');
    runDocumentChecks(
      documentProject.readme,
      JSON.parse(documentProject.filename),
      documentProject.website,
      documentProject.release,
    );
    const score = calculateCncfScore();
    await updateDocumentScore(project.id, score);
  } else {
    // create
    const githubToken = await getValidGithubToken();
    const octokit = new Octokit({
      auth: githubToken,
    });
    const githubInfo = await getGithubMetadata(octokit, project.htmlUrl);
    if (githubInfo === undefined) {
      return;
    }
    const { readme, filename, website, release } = githubInfo;

    runDocumentChecks(readme, filename, website, release);
    const score = calculateCncfScore();
    debug.log(`**** insert into database ****: ${project.htmlUrl}`);
    await createDocumentScore(
      project.id,
      project.htmlUrl,
      score,
      readme,
      website,
      release,
      filename,
    );
  }
}

/**
 *
 * @param {Object} options
 * @param {number} [options.startIndex]
 * @returns {Promise<void>}
 */
export async function syncAllProjectCncfDocumentScore(options) {
  const { startIndex } = options;
  debug.log('Sync CNCF Document Score');
  // 1. get all GitHub project
  let projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl'],
  });

  const projectCount = projectList.length;
  debug.log(`The Number of Project : ${projectCount}`);

  projectList = projectList.slice(startIndex);
  debug.log(`This round needs to synchronize the total number of projects: ${projectList.length}`);
  let count = startIndex;

  for (const project of projectList) {
    debug.log('Current document score Integration Progress: ', `${count + 1}/${projectCount}`);
    count += 1;
    await syncSingleProjectCncfDocumentScore(project);
    clearDocumentChecks();
  }
}

async function getValidGithubToken() {
  const tokenArray = JSON.parse(process.env.GITHUB_TOKEN);
  for (const token of tokenArray) {
    const octokit = new Octokit({
      auth: token,
    });
    const result = await octokit.request('GET /rate_limit', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (result.data.rate.remaining > 50) {
      return token;
    }
  }
  return null;
}

async function createDocumentScore(projectId, repoUrl, score, readme, website, release, filename) {
  await CncfDocumentScore.create({
    id: 0,
    projectId,
    repoUrl,
    readme,
    filename: JSON.stringify(filename),
    website,
    release,
    documentScore: score,
    hasReadme: cncfDocumentChecksSet.readme.checked,
    hasChangelog: cncfDocumentChecksSet.changelog.checked,
    hasContributing: cncfDocumentChecksSet.contributing.checked,
    hasWebsite: cncfDocumentChecksSet.website.checked,
  });
}

async function updateDocumentScore(projectId, score) {
  await CncfDocumentScore.update(
    {
      documentScore: score,
      hasReadme: cncfDocumentChecksSet.readme.checked,
      hasChangelog: cncfDocumentChecksSet.changelog.checked,
      hasContributing: cncfDocumentChecksSet.contributing.checked,
      hasWebsite: cncfDocumentChecksSet.website.checked,
    },
    {
      where: {
        projectId,
      },
    },
  );
}

function runDocumentChecks(readme, filename, website, release) {
  // Check if there is a website
  cncfDocumentChecksSet.website.checked =
    website != null && website !== '' && website !== undefined;
  if (cncfDocumentChecksSet.website.checked) {
    cncfDocumentChecksSet.website.path = website;
  }

  // Checks contributing/changelog/readme in repo
  for (const checksItem of Object.values(cncfDocumentChecksSet).filter(
    item => item.id !== 'website',
  )) {
    for (const path of filename) {
      if (checksItem.checked) {
        break;
      }
      checksItem.checked = checksItem.repoPattern.test(path);
      checksItem.path = path;
    }
  }

  // Check if change_log is in the most recent release
  debug.log('Check if change_log is in the most recent release');
  if (!cncfDocumentChecksSet.changelog.checked) {
    if (release != null && release.length !== 0) {
      cncfDocumentChecksSet.changelog.checked =
        cncfDocumentChecksSet.changelog.releasePattern.test(release);
      cncfDocumentChecksSet.changelog.path = 'release';
    }
  }
  // Checks changelog/contributing in readme content
  debug.log('Checks File in readme content');
  checkItemInReadme(cncfDocumentChecksSet.changelog.id, readme);
  checkItemInReadme(cncfDocumentChecksSet.contributing.id, readme);
  debug.log('Run document check success');
}

/*
  Checks if the item is in the readme
 */
function checkItemInReadme(item, readme) {
  if (cncfDocumentChecksSet[item].checked) {
    return;
  }
  cncfDocumentChecksSet[item].checked = cncfDocumentChecksSet[item].readmePattern.test(readme);
  if (cncfDocumentChecksSet[item].checked) {
    cncfDocumentChecksSet[item].path = cncfDocumentChecksSet.readme.path;
  }
}


async function getGithubMetadata(octokit, repoUrl) {
  const [owner, repo] = repoUrl.split('/').slice(-2);
  const website = await getWebsite(octokit, owner, repo);
  const filenameArray = await getRepoFileContent(octokit, owner, repo);
  const release = await getRelease(octokit, owner, repo);

  // check if readme file in repo before get readme
  let readme;
  // multi-language handle
  if (filenameArray.indexOf('README.md') > -1) {
    cncfDocumentChecksSet.readme.path = 'README.md';
    cncfDocumentChecksSet.readme.checked = true;
  } else {
    for (const filename of filenameArray) {
      if (cncfDocumentChecksSet.readme.repoPattern.test(filename) === true) {
        cncfDocumentChecksSet.readme.checked = true;
        cncfDocumentChecksSet.readme.path = filename;
        break;
      }
    }
  }
  if (cncfDocumentChecksSet.readme.checked) {
    readme = await getPathContent(octokit, cncfDocumentChecksSet.readme.path, owner, repo);
  }

  // github meta data
  return {
    readme,
    filename: filenameArray,
    website,
    release,
  };
}

function calculateCncfScore() {
  let score = 0.0;
  let weight = 0;

  Object.values(cncfDocumentChecksSet).forEach(checkItem => {
    weight += checkItem.weight;
  });
  Object.values(cncfDocumentChecksSet)
    .filter(checkItem => checkItem.checked)
    .forEach(item => {
      score += (item.weight / weight) * 100.0;
    });

  debug.log(
    '*** Checks Passed item: ',
    Object.values(cncfDocumentChecksSet)
      .filter(item => item.checked)
      .map(item => `${item.id}: ${item.path}`),
    `\n*** Weight: ${weight}, Score: ${score}`,
  );

  return score;
}

function clearDocumentChecks() {
  for (const checkItem of Object.values(cncfDocumentChecksSet)) {
    checkItem.checked = false;
    checkItem.path = '';
  }
}

/*
  Returns the names of all files in the project root and first level directories
 */
async function getRepoFileContent(octokit, owner, repo) {
  const repoFilenames = await getRepoContent(octokit, owner, repo);
  // Get the file name and directory name in the project root directory
  const firstDirs = [];
  const firstFileName = [];
  repoFilenames.forEach(data => {
    if (data.type === 'file') {
      firstFileName.push(data.name);
    }
    if (data.type === 'dir') {
      firstDirs.push(data.name);
    }
  });

  // Get the file name in the secondary directory
  const secondDirFileName = [];
  for (const dir of firstDirs) {
    const fileName = await getPathContent(octokit, dir, owner, repo);
    secondDirFileName.push(
      ...fileName.filter(file => file.type === 'file').map(file => `${dir}/${file.name}`),
    );
  }
  firstFileName.push(...secondDirFileName);
  return firstFileName;
}

async function getRepoContent(octokit, owner, repo) {
  const content = await octokit.request(`${BASIC_GITHUB_REPO_API}/contents`, {
    owner,
    repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github.raw+json',
    },
  });
  if (content.headers['x-ratelimit-remaining'] <= 0) {
    octokit.auth = getValidGithubToken();
  }
  return content.data;
}

/*
  Get the project root/path metadata, or 404 error if it doesn't exist.
 */
async function getPathContent(octokit, path, owner, repo) {
  const content = await octokit.request(`${BASIC_GITHUB_REPO_API}/contents/{path}`, {
    owner,
    repo,
    path,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github.raw+json',
    },
  });
  if (content.headers['x-ratelimit-remaining'] <= 0) {
    octokit.auth = getValidGithubToken();
  }
  return content.data;
}

/*
  Get the project website, or null if it doesn't exist.
 */
async function getWebsite(octokit, owner, repo) {
  const repoContent = await octokit.request(BASIC_GITHUB_REPO_API, {
    owner,
    repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (repoContent.headers['x-ratelimit-remaining'] <= 0) {
    octokit.auth = getValidGithubToken();
  }
  return repoContent.data.homepage;
}

/*
  Get the latest release of the project, or null if it doesn't exist.
 */
async function getRelease(octokit, owner, repo) {
  debug.log('------------- release ------------');
  const release = await octokit.request(`${BASIC_GITHUB_REPO_API}/releases`, {
    owner,
    repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (release.headers['x-ratelimit-remaining'] <= 0) {
    octokit.auth = getValidGithubToken();
  }
  if (release.data.length === 0) {
    return '';
  }
  return release.data[0].body;
}
