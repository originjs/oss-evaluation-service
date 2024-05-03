import debug from 'debug';
import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { CheerioCrawler, Configuration } from 'crawlee';
import { Cron } from 'croner';

export default async function syncProjectDependentCount(req, res) {
  debug.log('Sync Project dependent count');
  // 1. get all github project
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl', 'dependentCount'],
  });
  const sumOfProject = projectList.length;
  debug.log(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    debug.log('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. get project dependent count
    let dependentCount = await getProjectDependentCount(`${project.htmlUrl}/network/dependents`);
    if (dependentCount == '' || dependentCount == undefined) {
      continue;
    }

    await GithubProjects.update(
      { dependentCount: dependentCount },
      {
        where: {
          id: project.id,
        },
      },
    );
  }
  res.status(200).send('success');
}

async function getProjectDependentCount(url) {
  let dependentCount;
  const config = new Configuration({ persistStorage: false });
  const crawler = new CheerioCrawler(
    {
      failedRequestHandler({ request, log }) {
        log.info(`web crawler: Request to ${request.url} failed...`);
      },
      async requestHandler({ request, $, log }) {
        const content = $('a:contains("Repositories")');
        if (content) {
          const dependentArrays = content.text().match(/\d+/g);
          dependentCount =  (dependentArrays != undefined && dependentArrays.length > 0) ? dependentArrays.join('') : "";
        }
        log.info(`dependent count of ${request.loadedUrl} is ${dependentCount}`);
      },
      requestHandlerTimeoutSecs: 60,
      maxRequestsPerCrawl: 10,
      maxRequestRetries: 1,
      maxConcurrency: 4029,
      sameDomainDelaySecs: 10,
    },
    config,
  );
  try {
    await crawler.run([url]);
  } catch (e) {
    debug.log(`**Url get dependent count is failed !** :${url}`);
  }
  return dependentCount;
}


const errorHandler = e => {
  debug.log(e);
};

const syncProjectDependentCountTimerTask = Cron(
  '0 0 0 ? * FRI',
  { catch: errorHandler, timezone: 'Etc/UTC' },
  async () => {
    debug.log('syncProjectDependentCount start!', syncProjectDependentCountTimerTask.getPattern());
    await syncProjectDependentCount();
    debug.log('syncProjectDependentCount end!', syncProjectDependentCountTimerTask.getPattern());
  },
);
