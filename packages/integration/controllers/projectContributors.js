import debug from 'debug';
import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { CheerioCrawler, Configuration } from 'crawlee';
import { Cron } from 'croner';

export default async function syncProjectContributors(req, res) {
  debug.log('Sync Project Contributors');
  // 1. get all github project
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl', 'contributors'],
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
        async requestHandler({ request, $, log }) {
          const content = $('a:contains("Contributors")').text();
          const contributorsArrays = content.match(/\d+/g);
          if (contributorsArrays != undefined && contributorsArrays.length > 0) {
            contributors = contributorsArrays.join('');
          }
          log.info(`contributors of ${request.loadedUrl} is ${contributors}`);
        },
        maxRequestsPerCrawl: 400000,
        maxRequestRetries: 1,
        sameDomainDelaySecs: 360000,
      },
      config
    );
    await crawler.run([url]);
  } catch (e) {
    debug.log(`**Url get contributors is failed !** :${url}`);
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
