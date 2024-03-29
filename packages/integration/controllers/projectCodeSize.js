import debug from 'debug';
import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { CheerioCrawler, Configuration } from 'crawlee';
import { Cron } from 'croner';

export default async function syncProjectCodeSize(req, res) {
  debug.log('Sync Porject Code Size');
  // 1. get all github project
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'ownerName', 'name', 'codeSize'],
  });
  const sumOfProject = projectList.length;
  debug.log(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    debug.log('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    const url = `https://git-cloc.fly.dev/cloc/${project.ownerName}/${project.name}`;
    // 2. get project code size
    const codeSize = await getProjectCodeSize(url);
    if (codeSize == '') {
      continue;
    }

    await GithubProjects.update(
      { codeSize: codeSize },
      {
        where: {
          id: project.id,
        },
      },
    );
  }
  res.status(200).send('success');
}

async function getProjectCodeSize(url) {
  let codeSize;
  const config = new Configuration({ persistStorage: false })
  const crawler = new CheerioCrawler({
    async requestHandler({ request, $, log }) {
      const thead = $('#cloc-table > thead > tr').text();
      const head = thead.replaceAll(' ', '').split('\n');
      if (head.length > 0 && head.indexOf('Code') > 0) {
        const index = head.indexOf('Code');
        const tfoot = $('#cloc-table > tfoot > tr').text();
        codeSize = tfoot.replaceAll(' ', '').split('\n')[index].rreplaceAll(',', '');
      }
      log.info(`codeSize of ${request.loadedUrl} is ${codeSize}`);
    },
    maxRequestsPerCrawl: 20000,
    maxRequestRetries: 1,
  }, config);
  await crawler.run([url]);
  return codeSize;
}

const errorHandler = e => {
  debug.log(e);
};

const syncProjectCodeSizeTimerTask = Cron(
  '0 0 0 ? * WED',
  { catch: errorHandler, timezone: 'Etc/UTC' },
  async () => {
    debug.log('syncProjectCodeSize start!', syncProjectCodeSizeTimerTask.getPattern());
    await syncProjectCodeSize();
    debug.log('syncProjectCodeSize end!', syncProjectCodeSizeTimerTask.getPattern());
  })
