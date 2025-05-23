import {
  ViewProjects,
  GithubProjectsTable,
  logger,
  ProjectPackage,
} from '@orginjs/oss-evaluation-data-model';
import { CheerioCrawler, Configuration } from 'crawlee';
import { getProjectByUrl } from '../util/util.js';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';

ViewProjects.hasMany(ProjectPackage, {
  foreignKey: 'pId',
  as: 'projectPackage',
});

export async function syncSingleProjectDependentCountHandler(req, res) {
  const { repoUrl: repoUrl } = req.params;
  const project = await getProjectByUrl(repoUrl);
  await syncSingleProjectDependentCount(project);
  res.status(200).send('success');
}

export async function syncAllProjectDependentCountHandler(req, res) {
  await syncAllProjectDependentCount();
  res.status(200).send('success');
}

/**
 * Synchronize Single Project Dependent Count
 * @param {Object} project project info
 * @returns {Promise<*>} inserted project dependent count
 */
export async function syncSingleProjectDependentCount(project) {
  await syncProjectDependentCount(project.pId);
}

export async function syncAllProjectDependentCount() {
  await syncProjectDependentCount();
}

export default async function syncProjectDependentCount(pId) {
  logger.info('Sync Project dependent count');
  // 1. get all project
  const projectList = await ViewProjects.findAll({
    include: [
      {
        model: ProjectPackage,
        as: 'projectPackage',
        required: false,
        where: {
          main_package: true,
        },
      },
    ],
    attributes: ['pId', 'htmlUrl', 'dependentRepositories', 'dependentPackages'],
    where: pId
      ? {
          pId,
        }
      : {},
  });
  const sumOfProject = projectList.length;
  logger.info(`The Number of Project : ${sumOfProject}`);
  let count = 1;
  for (const project of projectList) {
    logger.info('**Current Progress**: ', `${count}/${sumOfProject}`);
    count += 1;
    // 2. get project dependent count
    let url = `${project.htmlUrl}/network/dependents`;
    url = await getProjectMainPackageUrl(
      url,
      project.projectPackage.length > 0 ? project.projectPackage[0].package : '',
    );
    const dependentCount = await getProjectDependentCount(url);
    if (
      dependentCount.repositories != undefined &&
      dependentCount.packages != undefined &&
      dependentCount.repositories != '' &&
      dependentCount.packages != ''
    ) {
      await GithubProjectsTable.update(
        {
          dependentRepositories: dependentCount.repositories,
          dependentPackages: dependentCount.packages,
        },
        {
          where: {
            pId: project.pId,
          },
        },
      );
    }
  }
}

async function getProjectDependentCount(url) {
  let repos;
  let packs;
  const config = new Configuration({ persistStorage: false });
  const crawler = new CheerioCrawler(
    {
      failedRequestHandler({ request, log }) {
        log.info(`web crawler: Request to ${request.url} failed...`);
      },
      async requestHandler({ request, $, log }) {
        const repositories = $('a:contains("Repositor")');
        const packages = $('a:contains("Package")');
        if (repositories) {
          const repository = repositories.text().match(/\d+/g);
          repos = repository != undefined && repository.length > 0 ? repository.join('') : '';
        }
        if (packages) {
          const pack = packages.text().match(/\d+/g);
          packs = pack != undefined && pack.length > 0 ? pack.join('') : '';
        }
        log.info(`dependent repositories of ${request.loadedUrl} is ${repos}`);
        log.info(`dependent packages of ${request.loadedUrl} is ${packs}`);
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
    logger.error(`**Url get dependent count is failed !** :${url}`);
  }
  return { repositories: repos, packages: packs };
}

async function getProjectMainPackageUrl(url, packageName) {
  if (packageName === '' || packageName === undefined) {
    return url;
  }
  let urlResult = url;
  const config = new Configuration({ persistStorage: false });
  const crawler = new CheerioCrawler(
    {
      failedRequestHandler({ request, log }) {
        log.info(`Get project main package url: Request to ${request.url} failed...`);
      },
      requestHandler: async function ({ $, log }) {
        const context = $(`.select-menu-item span:contains(" ${packageName}\n")`);
        const selectContext = context.text().replaceAll('\n', '').replaceAll(' ', '');
        if (context.length > 0 && selectContext === packageName) {
          const attrs = context.get(0).parent.attributes;
          attrs.forEach(attr => {
            if (attr.name === 'href') {
              const href = attr.value;
              const index = href.indexOf('?');
              const urlSuffix = href.substring(index);
              urlResult = urlResult.concat(urlSuffix);
            }
          });
        }
        log.info(`Get project main package url: ${urlResult} `);
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
    logger.error(`**Get project main package url is failed !** :${url}`);
  }
  return urlResult;
}

export async function projectDependentCountScheduler() {
  const startTime = process.hrtime();
  logger.info('[Integration][DependentCount] Integration Job start');
  await syncAllProjectDependentCount();
  logger.info('[Integration][DependentCount] Integration Job end');
  const endTime = process.hrtime(startTime);
  logger.info(
    `[Integration][DependentCount] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
  );
}

// Add monitoring to all task functions in your scheduled task
export const projectDependentCountTimer = addMonitoringToTask(
  projectDependentCountScheduler,
  'projectDependentCountTimer',
  'projectDependentCountTimer',
);
