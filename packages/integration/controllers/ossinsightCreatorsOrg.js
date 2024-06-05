import {
  GithubProjects,
  logger,
  OssinsightCreatorsOrganizations,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';

const prOrganizationsUrl =
  'https://api.ossinsight.io/q/analyze-pull-request-creators-company?repoId=:repoId&limit=50';
const starOrganizationsUrl =
  'https://api.ossinsight.io/q/analyze-stars-company?repoId=:repoId&limit=50';
const issueOrganizationsUrl =
  'https://api.ossinsight.io/q/analyze-issue-creators-company?repoId=:repoId&limit=50';

const QUERY_SQL = `
select distinct project.id,
                project.name,
                project.full_name as fullName
from github_projects project
         left join (select *
                    from ossinsight_creators_organizations
                    where updated_at >= :startDate) organization on project.id = project_id
where isnull(project_id)
and project.id >= :startId
and project.id <= :endId
order by id;
`;
const integrationInfo = {
  prOrganizations: { type: 0, url: prOrganizationsUrl },
  starOrganizations: { type: 1, url: starOrganizationsUrl },
  issueOrganizations: { type: 2, url: issueOrganizationsUrl },
};

/**
 * Synchronizes the pull request creators organizations data for all projects.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<void>} A promise that resolves when the synchronization is complete.
 */
export async function syncAllProjectCreatorsOrgHandler(req, res) {
  const { startDate, minId, maxId } = req.body;
  let startId = minId || (await GithubProjects.min('id'));
  let endId = maxId || (await GithubProjects.max('id'));

  const projectList = await sequelize.query(QUERY_SQL, {
    replacements: { startDate, startId, endId },
    type: sequelize.QueryTypes.SELECT,
  });
  await syncAllProjectCreatorsOrg(projectList);

  res.status(200).json('ok');
}

/**
 * Synchronizes the creators organizations data for a single project.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<void>} A promise that resolves when the synchronization is complete.
 */
export async function syncSingleProjectCreatorsOrgHandler(req, res) {
  const { repoUrl } = req.body;
  let project = await GithubProjects.findOne({
    where: {
      htmlUrl: repoUrl,
    },
    attributes: ['id', 'fullName'],
  });
  await syncSingleProjectCreatorsOrg(project);

  res.status(200).json('ok');
}

/**
 * Synchronizes the creators organizations data for a single project.
 *
 * @param {Object} project - The Github project data.
 * @return {Promise<void>} A promise that resolves when the synchronization is complete.
 */
export async function syncSingleProjectCreatorsOrg(project) {
  let organizationList = [];
  for (let option of Object.values(integrationInfo)) {
    organizationList = await getCreatorsOrg(project, option);
    if (organizationList.length > 0) {
      await bulkInsertData(organizationList);
    }
  }
}

/**
 * Synchronizes the pull request creators organizations data for all projects.
 *
 * @param {Array} projectList - An array of Github project data.
 * @return {Promise<void>} A promise that resolves when all the data has been synchronized.
 */
export async function syncAllProjectCreatorsOrg(projectList) {
  for (let project of projectList) {
    if (project && project.id) {
      await syncSingleProjectCreatorsOrg(project);
    }
  }
}

async function getCreatorsOrg(project, option) {
  const res = [];
  const result = await sendRequestByFullName(project.id, option.url);
  const organizationList = result?.data;
  if (
    organizationList === null ||
    organizationList === undefined ||
    organizationList.length === 0
  ) {
    logger.info(
      'sync project data from ossinsight, data not found!',
      project.fullName,
      project.id,
      option.url,
    );
  } else {
    organizationList.forEach(el => {
      res.push({
        project_id: project.id,
        org_name: el.company_name,
        creators_num: getCreatorsNum(el, option.type),
        percentage: el.proportion,
        type: option.type,
      });
    });
    logger.info(
      'sync project data from ossinsight, successful!',
      project.fullName,
      project.id,
      option.url,
    );
  }
  return res;
}

function getCreatorsNum(el, type) {
  if (type === 0) {
    return el.code_contributors;
  }
  if (type === 1) {
    return el.stargazers;
  }
  if (type === 2) {
    return el.issue_creators;
  }
}

export async function sendRequestByFullName(repoId, url) {
  const fetchUrl = url.replace(':repoId', repoId);
  const response = await fetch(fetchUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    retryOptions: {
      retryMaxDuration: 3600000, // 60 min retry duration
      retryInitialDelay: 100,
      retryOnHttpResponse: response => {
        return (
          response.status === 500 || response.message === 'Rate limit exceeded, retry in 1 hour'
        );
      },
    },
  })
    .then(response => {
      return response.json();
    })
    .catch(error => {
      logger.error('fetch project data from ossinsight failed! url:{} error:{}', url, error);
    });
  return response;
}

async function bulkInsertData(data) {
  try {
    await sequelize.transaction(async t => {
      await OssinsightCreatorsOrganizations.destroy(
        {
          where: {
            project_id: data[0]?.project_id,
            type: data[0]?.type,
          },
        },
        { transaction: t },
      );
      await OssinsightCreatorsOrganizations.bulkCreate(
        data,
        {
          updateOnDuplicate: [
            'project_id',
            'org_name',
            'creators_num',
            'percentage',
            'type',
            'updated_at',
          ],
        },
        { transaction: t },
      );
    });
    logger.info('Batch insertion or update succeeded.');
  } catch (error) {
    logger.error(`Batch insertion or update failed: ${error}`);
  }
}
