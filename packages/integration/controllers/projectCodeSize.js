import { GithubProjects, logger } from '@orginjs/oss-evaluation-data-model';
import { CheerioCrawler, Configuration } from 'crawlee';
import { Cron } from 'croner';
import { XMLParser } from 'fast-xml-parser';
import { getProjectByUrl } from '../util/util.js';

export default async function syncSingleProjectCodeSizeHandler(req, res) {
  const { repoUrl: repoUrl } = req.params;
  const project = await getProjectByUrl(repoUrl);
  await syncSingleProjectCodeSize(project);
  res.status(200).send('success');
}

export async function syncAllProjectCodeSizeHandler(req, res) {
  await syncAllProjectCodeSize();
  res.status(200).send('success');
}

/**
 * Synchronize Single Project Code Size
 * @param {Object} project project info
 * @returns {Promise<*>} inserted project code size
 */
export async function syncSingleProjectCodeSize(project) {
  await syncProjectCodeSize(project.id);
}

export async function syncAllProjectCodeSize() {
  await syncProjectCodeSize();
}

async function syncProjectCodeSize(projectId) {
  logger.info('Sync Project Code Size');
  // 1. get all github project
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'ownerName', 'name', 'codeSize'],
    where: projectId
      ? {
          id: projectId,
        }
      : {},
  });
  const sumOfProject = projectList.length;
  logger.info(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    logger.info('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    const url = `https://git-cloc.fly.dev/cloc/${project.ownerName}/${project.name}`;
    const tokeiUrl = `https://tokei.rs/b1/github/${project.ownerName}/${project.name}`;
    // 2. get project code size
    let codeSize = await getProjectCodeSize(url, tokeiUrl);
    if (codeSize === '' || codeSize === undefined) {
      codeSize = await getCodeSizeByOtherWays(project.ownerName, project.name);
    }

    if (codeSize === '' || codeSize === undefined) {
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
}

async function getProjectCodeSize(url, otherUrl) {
  let codeSize;
  const config = new Configuration({ persistStorage: false });
  const crawler = new CheerioCrawler(
    {
      async requestHandler({ request, $, log }) {
        const thead = $('#cloc-table > thead > tr').text();
        const head = thead.replaceAll(' ', '').split('\n');
        if (head.length > 0 && head.indexOf('Code') > 0) {
          const index = head.indexOf('Code');
          const tfoot = $('#cloc-table > tfoot > tr').text();
          codeSize = tfoot.replaceAll(' ', '').split('\n')[index].replaceAll(',', '');
        }
        log.info(`codeSize of ${request.loadedUrl} is ${codeSize}`);
      },
      maxRequestsPerCrawl: 20000,
      maxRequestRetries: 1,
    },
    config,
  );
  const crawlerOther = new CheerioCrawler(
    {
      async requestHandler({ request, body, log }) {
        const svgContent = body.toString();
        // Parse SVG files
        const parser = new XMLParser();
        const jsonObj = parser.parse(svgContent);

        // Extract text nodes
        const textContents = jsonObj['svg']['g'] ? jsonObj['svg']['g'][1].text[2] : [];

        log.info(`textContents is : ${textContents}`);
        let codeTextReplace = textContents.toString();
        if (codeTextReplace.indexOf('K') > 0) {
          codeTextReplace = codeTextReplace.replaceAll('K', '');
          codeTextReplace = codeTextReplace * 1000;
        } else if (codeTextReplace.indexOf('M') > 0) {
          codeTextReplace = codeTextReplace.replaceAll('M', '');
          codeTextReplace = codeTextReplace * 1000000;
        } else {
          log.info(`This value does not require special processing: ${codeTextReplace}`);
        }

        codeSize = codeTextReplace;
        log.info(`codeSize of ${request.loadedUrl} is ${codeSize}`);
      },
      maxRequestsPerCrawl: 20000,
      maxRequestRetries: 1,
      additionalMimeTypes: ['image/svg+xml', 'application/octet-stream', 'text/plain'],
    },
    config,
  );

  await crawler.run([url]);
  if (codeSize == '' || codeSize == undefined) {
    await crawlerOther.run([otherUrl]);
  }
  return codeSize;
}

async function getCodeSizeByOtherWays(ownerName, name) {
  const url = `https://api.codetabs.com/v1/loc?github=${ownerName}/${name}`;
  try {
    logger.info(`**loadUrl is** :${url}`);
    const response = await fetch(url, {
      retryOptions: {
        retryMaxDuration: 3600000, // 60 min retry duration
        retryInitialDelay: 100,
      },
    });

    if (response.ok) {
      const body = await response.json();
      const index = body.length - 1;
      if (index > 0 && body[index].language == 'Total') {
        const codeSize = body[index].linesOfCode;
        logger.info(`**codeSize of '${url} is :${codeSize}`);
        return codeSize;
      }
    }
    return '';
  } catch (e) {
    logger.error(`**Url get code size is failed !** :${url}`);
  }
}

const errorHandler = e => {
  logger.error(e);
};

const syncProjectCodeSizeTimerTask = Cron(
  '0 0 0 ? * WED',
  { catch: errorHandler, timezone: 'Etc/UTC' },
  async () => {
    logger.info('syncProjectCodeSize start!', syncProjectCodeSizeTimerTask.getPattern());
    await syncAllProjectCodeSize();
    logger.info('syncProjectCodeSize end!', syncProjectCodeSizeTimerTask.getPattern());
  },
);
