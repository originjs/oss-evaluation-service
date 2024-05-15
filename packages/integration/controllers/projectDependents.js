import debug from 'debug';
import { GithubProjects, ProjectPackage} from '@orginjs/oss-evaluation-data-model';
import { CheerioCrawler, Configuration } from 'crawlee';
import { Cron } from 'croner';
GithubProjects.hasMany(ProjectPackage, {
  foreignKey: 'project_id',
  as: 'projectPackage',
});

export default async function syncProjectDependentCount(req, res) {
  debug.log('Sync Project dependent count');
  // 1. get all github project
  const { projectId: projectId } = req.params;
  const projectList = await GithubProjects.findAll({
    include: [
      {
        model: ProjectPackage,
        as: 'projectPackage',
        required: false,
        where: {
          main_package: 1
        }
      },
    ],
    attributes: ['id', 'htmlUrl', 'dependentRepositories', 'dependentPackages'],
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
    // 2. get project dependent count
    let url = `${project.htmlUrl}/network/dependents`;
    url = await getProjectMainPackageUrl(url, project.projectPackage.length > 0 ? project.projectPackage[0].package : "");
    const dependentCount = await getProjectDependentCount(url);
    if (
      dependentCount.repositories != undefined &&
      dependentCount.packages != undefined &&
      dependentCount.repositories != '' &&
      dependentCount.packages != ''
    ) {
      await GithubProjects.update(
        {
          dependentRepositories: dependentCount.repositories,
          dependentPackages: dependentCount.packages,
        },
        {
          where: {
            id: project.id,
          },
        },
      );
    }
  }
  res.status(200).send('success');
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
    debug.log(`**Url get dependent count is failed !** :${url}`);
  }
  return { repositories: repos, packages: packs };
}

async function getProjectMainPackageUrl(url, packageName) {
  if (packageName === "" || packageName === undefined) {
    return url;
  }
  let urlResult = url;
  const config = new Configuration({ persistStorage: false });
  const crawler = new CheerioCrawler(
    {
      failedRequestHandler({ request, log }) {
        log.info(`Get project main package url: Request to ${request.url} failed...`);
      },
      requestHandler: async function({$, log }) {
        const context = $(`.select-menu-item span:contains(" ${packageName}\n")`);
        const selectContext = context.text().replaceAll('\n', '').replaceAll(' ', '');
        if (context.length > 0 && selectContext === packageName) {
          const attrs = context.get(0).parent.attributes;
          attrs.forEach(attr => {
            if (attr.name === "href") {
              const href = attr.value;
              const index = href.indexOf("?");
              const urlSuffix = href.substring(index);
              urlResult = urlResult.concat(urlSuffix);
            }
          })
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
    debug.log(`**Get project main package url is failed !** :${url}`);
  }
  return urlResult;
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
