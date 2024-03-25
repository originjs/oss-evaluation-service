import debug from 'debug';
import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { CheerioCrawler } from 'crawlee';

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
    if (project.codeSize > 0) {
      continue;
    }
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
  const crawler = new CheerioCrawler({
    async requestHandler({ request, $, enqueueLinks, log }) {
      const thead = $('#cloc-table > thead > tr').text();
      const head = thead.replaceAll(' ', '').split('\n');
      if (head.length > 0 && head.indexOf('Code') > 0) {
        const index = head.indexOf('Code');
        const tfoot = $('#cloc-table > tfoot > tr').text();
        codeSize = tfoot[index].replaceAll(' ', '').split('\n');
      }
      log.info(`codeSize of ${request.loadedUrl} is '${codeSize}`);
    },
    maxRequestsPerCrawl: 20000,
    maxRequestRetries: 1,
    statisticsOptions: { enabled: false },
  });
  await crawler.run([url]);
  return codeSize;
}
