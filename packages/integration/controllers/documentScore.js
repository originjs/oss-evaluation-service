import debug from 'debug';
import { Octokit } from '@octokit/core';
import { GithubProjects, CncfDocumentScore } from '@orginjs/oss-evaluation-data-model';

// cncf document checks item
const cncfDocumentChecks = {
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
    readmePattern: new RegExp([String.raw`^#+.*changelog.*$`, String.raw`^changelog$`,
      String.raw`\[.*changelog.*\]\(.*\)`].join('|'), 'im'),
    releasePattern: new RegExp(['changelog', 'changes'].join('|'), 'i'),
    checked: false,
    path: '',
  },
  contributing: {
    id: 'contributing',
    weight: 4,
    repoPattern: new RegExp(['contributing*', '.github/contributing*', 'docs/contributing*'].join('|'), 'i'),
    readmePattern: new RegExp([String.raw`^#+.*contributing.*$`, String.raw`^contributing$`,
      String.raw`\[.*contributing.*\]\(.*\)`].join('|'), 'im'),
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

export default async function syncCNCFDocumentScore(req, res) {
  debug.log('Sync CNCF Document Score');
  // 1. get all github project
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl'],
  });

  const sumOfProject = projectList.length;
  debug.log(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    debug.log('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;

    const documentProject = await CncfDocumentScore
      .findOne({ where: { repoUrl: project.htmlUrl } });
    if (documentProject != null) {
      debug.log('*** Already calculate, skip to next project ***');
      continue;
    }

    const {
      readme, filename, website, release,
    } = await integrateCncfDocumentInformation(project.htmlUrl);
    runDocumentChecks(readme, filename, website, release);
    const score = calculateCncfScore();

    debug.log(`insert into database: ${project.htmlUrl}`);
    debug.log('*** Insert into database ***');
    await CncfDocumentScore.create({
      id: 0,
      projectId: project.id,
      repoUrl: project.htmlUrl,
      readme,
      filename: JSON.stringify(filename),
      website,
      release,
      documentScore: score,
    });
    clearDocumentChecks();
  }
  res.status(200).send('success');
}

function runDocumentChecks(readme, filename, website, release) {
  //  1. Check if there is a website
  cncfDocumentChecks.website.checked = (website != null && website !== '' && website !== undefined);
  if (cncfDocumentChecks.website.checked) {
    cncfDocumentChecks.website.path = website;
  }

  // 2. Checks File in repo
  for (const checksItem of Object.values(cncfDocumentChecks)) {
    for (const path of filename) {
      if (checksItem.checked || checksItem.id === 'website') {
        break;
      }
      checksItem.checked = checksItem.repoPattern.test(path);
      checksItem.path = path;
    }
  }

  // 3. Check if change_log is in the most recent release
  debug.log('Check if change_log is in the most recent release');
  if (release != null && release.length !== 0) {
    cncfDocumentChecks.changelog.checked = cncfDocumentChecks.changelog
      .releasePattern.test(release.body);
    cncfDocumentChecks.changelog.path = 'release';
  }
  // 4. Checks changelog/contributing in readme content
  debug.log('Checks File in readme content');
  if (!cncfDocumentChecks.readme.checked) {
    return;
  }

  if (!cncfDocumentChecks.changelog.checked) {
    cncfDocumentChecks.changelog.checked = cncfDocumentChecks.changelog
      .readmePattern.test(readme);
    if (cncfDocumentChecks.changelog.checked) {
      cncfDocumentChecks.changelog.path = cncfDocumentChecks.readme.path;
    }
  }
  if (!cncfDocumentChecks.contributing.checked) {
    cncfDocumentChecks.contributing.checked = cncfDocumentChecks.contributing
      .readmePattern.test(readme);
    if (cncfDocumentChecks.contributing.checked) {
      cncfDocumentChecks.contributing.path = cncfDocumentChecks.readme.path;
    }
  }
  debug.log('Run document check success');
}

async function getValidGithubToken() {
  const githubTokenArray = process.env.GITHUB_TOKEN.split(';');
  for (const token of githubTokenArray) {
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

async function integrateCncfDocumentInformation(repoUrl) {
  const githubToken = await getValidGithubToken();
  const octokit = new Octokit({
    auth: githubToken,
  });

  const [owner, repo] = repoUrl.split('/').slice(-2);
  const website = await getWebsite(octokit, owner, repo);
  const filenameArray = await getRepoFileContent(octokit, owner, repo);
  const release = await getRelease(octokit, owner, repo);

  // check if there readme file in repo before get readme
  let readme;
  // multi-language handle
  if (filenameArray.indexOf('README.md') > -1) {
    cncfDocumentChecks.readme.path = 'README.md';
    cncfDocumentChecks.readme.checked = true;
  } else {
    for (const filename of filenameArray) {
      if (cncfDocumentChecks.readme.repoPattern.test(filename) === true) {
        cncfDocumentChecks.readme.checked = true;
        cncfDocumentChecks.readme.path = filename;
        break;
      }
    }
  }
  if (cncfDocumentChecks.readme.checked) {
    readme = await getReadmeContent(octokit, cncfDocumentChecks.readme.path, owner, repo);
  }

  // checks project in database
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

  Object.values(cncfDocumentChecks).forEach((item) => {
    weight += item.weight;
  });
  Object.values(cncfDocumentChecks).filter((item) => item.checked).forEach((item) => {
    score += (item.weight / weight) * 100.0;
  });

  debug.log('*** Passed item: ', Object.values(cncfDocumentChecks)
    .filter((item) => item.checked)
    .map((item) => `${item.id}: ${item.path}`), `\n*** weight: ${weight}, score: ${score}`);

  return score;
}

function clearDocumentChecks() {
  for (const checkItem of Object.values(cncfDocumentChecks)) {
    checkItem.checked = false;
    checkItem.path = '';
  }
}

async function getReadmeContent(octokit, filename, owner, repo) {
  const readme = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path: filename,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github.raw+json',
    },
  });
  return readme.data;
}

async function getRepoFileContent(octokit, owner, repo) {
  // Get the file names in the root directory and secondary directories
  const repoContentsRoute = 'GET /repos/{owner}/{repo}/contents/{path}';
  const content = await octokit.request(repoContentsRoute, {
    owner,
    repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  // Get the file name and directory name in the project root directory
  const firstDirs = [];
  const firstFileName = [];
  content.data.forEach((data) => {
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
    const fileName = await octokit.request(repoContentsRoute, {
      owner,
      repo,
      path: dir,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    secondDirFileName.push(...fileName.data
      .filter((file) => file.type === 'file')
      .map((file) => `${dir}/${file.name}`));
  }
  firstFileName.push(...secondDirFileName);
  return firstFileName;
}
async function getWebsite(octokit, owner, repo) {
  const repoContent = await octokit.request('GET /repos/{owner}/{repo}', {
    owner,
    repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  return repoContent.data.homepage;
}

async function getRelease(octokit, owner, repo) {
  const release = await octokit.request('GET /repos/{owner}/{repo}/releases', {
    owner,
    repo,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (release.data.length === 0) {
    return '';
  }
  return release[0];
}
