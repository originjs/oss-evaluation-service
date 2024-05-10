import debug from 'debug';
import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { CheerioCrawler, Configuration } from 'crawlee';
import { Cron } from 'croner';

export default async function syncProjectContributors(req, res) {
  debug.log('Sync Project Contributors');
  // 1. get all github project
  const { projectId: projectId } = req.params;
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl', 'fullName', 'contributors'],
    where: projectId
      ? {
          id: projectId,
        }
      : {},
  });
  const sumOfProject = projectList.length;
  debug.log(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    debug.log('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. get project contributors
    let contributors = await getProjectContributors(project.htmlUrl);
    if (contributors == '' || contributors == undefined) {
      contributors = (await getAlllContributors(project.fullName)).length;
      debug.log(`GitHub API : contributors of ${project.htmlUrl} is ${contributors}`);
    }
    if (contributors == '' || contributors == undefined) {
      continue;
    }

    await GithubProjects.update(
      { contributors: contributors },
      {
        where: {
          id: project.id,
        },
      },
    );
  }
  res.status(200).send('success');
}

async function getProjectContributors(url) {
  let contributors;
  try {
    const config = new Configuration({ persistStorage: false });
    const crawler = new CheerioCrawler(
      {
        failedRequestHandler({ request, log }) {
          log.info(`web crawler: Request to ${request.url} failed...`);
        },
        async requestHandler({ request, $, log }) {
          const content = $('a:contains("Contributors")');
          if (content) {
            const contributorsArrays = content.text().match(/\d+/g);
            contributors =
              contributorsArrays != undefined && contributorsArrays.length > 0
                ? contributorsArrays.join('')
                : '';
          }
          log.info(`web crawler: contributors of ${request.loadedUrl} is ${contributors}`);
        },
        requestHandlerTimeoutSecs: 60,
        maxRequestsPerCrawl: 10,
        maxRequestRetries: 1,
        maxConcurrency: 4029,
        sameDomainDelaySecs: 10,
      },
      config,
    );
    await crawler.run([url]);
  } catch (e) {
    debug.log(`**web crawler: Url get contributors is failed !** :${url}`);
  }
  return contributors;
}

const errorHandler = e => {
  debug.log(e);
};

const syncProjectContributorsTimerTask = Cron(
  '0 0 0 ? * THU',
  { catch: errorHandler, timezone: 'Etc/UTC' },
  async () => {
    debug.log('syncProjectContributors start!', syncProjectContributorsTimerTask.getPattern());
    await syncProjectContributors();
    debug.log('syncProjectContributors end!', syncProjectContributorsTimerTask.getPattern());
  },
);

async function getContributors(repoName, page = 1) {
  const request = await fetch(
    `https://api.github.com/repos/${repoName}/contributors?per_page=100&page=${page}&anon=true`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  const contributorsList = await request.json();
  return contributorsList;
}

async function getAlllContributors(repoName) {
  let contributors = [];
  let page = 1;
  let list;
  do {
    list = await getContributors(repoName, page);
    contributors = contributors.concat(list);
    page++;
  } while (list.length > 0);
  for (let i = 0; i < contributors.length; i++) {
    if (Object.prototype.hasOwnProperty.call(contributors[i], 'email')) {
      contributors.splice(i, 1);
    }
  }
  return contributors;
}
