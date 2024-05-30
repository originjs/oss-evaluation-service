import {
  GithubProjects,
  OssinsightCreatorsOrganizations,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';
import debug from 'debug';

const issueOrganizationsUrl =
  'https://api.ossinsight.io/v1/repos/:owner/:repo/issue_creators/organizations/';
const prOrganizationsUrl =
  'https://api.ossinsight.io/v1/repos/:owner/:repo/pull_request_creators/organizations/';
const starOrganizationsUrl =
  'https://api.ossinsight.io/v1/repos/:owner/:repo/stargazers/organizations/';

const QUERY_SQL = `
select distinct project.id,
                project.name,
                project.full_name as fullName,
from github_projects project
         left join (select *
                    from ossinsight_creators_organizations
                    where updated_at >= :startDate and type = :type) organization on project.id = project_id
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
  const options = Object.values(integrationInfo);
  for (const option of options) {
    await syncAllProjectCreatorsOrg(req, option);
  }

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
  const options = Object.values(integrationInfo);

  for (const option of options) {
    await syncSingleProjectCreatorsOrg(req, option);
  }

  res.status(200).json('ok');
}

/**
 * Synchronizes the pull request creators organizations data for a single project.
 *
 * @param {Object} project - The Github project data.
 * @param {Object} option - The options for getting the creators organizations.
 * @return {Promise<void>} A promise that resolves when the synchronization is complete.
 */
export async function syncSingleProjectCreatorsOrg(req, option) {
  const { repoUrl } = req.body;
  let project = await GithubProjects.findOne({
    where: {
      htmlUrl: repoUrl,
    },
    attributes: ['id', 'fullName'],
  });
  const organizationList = await getCreatorsOrg(project, option);
  await bulkUpsertData(organizationList);
}

/**
 * Synchronizes the pull request creators organizations data for all projects.
 *
 * @param {Array} projectList - An array of Github project data.
 * @param {Object} option - The options for getting the creators organizations.
 * @return {Promise<void>} A promise that resolves when all the data has been synchronized.
 */
export async function syncAllProjectCreatorsOrg(req, option) {
  const { startDate, minId, maxId } = req.body;
  let organizationLists = [];
  let startId = minId || (await GithubProjects.min('id'));
  let endId = maxId || (await GithubProjects.max('id'));
  const projectList = await sequelize.query(QUERY_SQL, {
    replacements: { startDate, startId, endId, type: option.type },
    type: sequelize.QueryTypes.SELECT,
  });
  for (let project of projectList) {
    if (project && project.fullName) {
      let org = await getCreatorsOrg(project, option);
      if (org.length === 0) {
        continue;
      }
      organizationLists.push(...org);
    }
    if (organizationLists.length > 1000) {
      await bulkUpsertData(organizationLists);
      organizationLists = [];
    }
  }

  await bulkUpsertData(organizationLists);
}

async function getCreatorsOrg(project, option) {
  const res = [];
  const result = await sendRequestByFullName(project.fullName, option.url);
  const organizationList = result?.data?.rows;
  if (
    organizationList === null ||
    organizationList === undefined ||
    organizationList.length === 0
  ) {
    debug.log('sync project data from ossinsight, data not found!', project.fullName, option.url);
  } else {
    organizationList.forEach(el => {
      res.push({
        project_id: project.id,
        org_name: el.org_name,
        creators_num: getCreatorsNum(el, option.type),
        percentage: el.percentage,
        type: option.type,
      });
    });
  }
  return res;
}

function getCreatorsNum(el, type) {
  if (type === 0) {
    return el.pull_request_creators;
  }
  if (type === 1) {
    return el.stargazers;
  }
  if (type === 2) {
    return el.issue_creators;
  }
}

export async function sendRequestByFullName(fullName, url) {
  const fetchUrl = url.replace(':owner/:repo', fullName);
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
      debug.log('fetch project data from ossinsight failed! url:{} error:{}', url, error);
    });
  return response;
}

async function bulkUpsertData(data) {
  try {
    await OssinsightCreatorsOrganizations.bulkCreate(data, {
      updateOnDuplicate: [
        'project_id',
        'org_name',
        'creators_num',
        'percentage',
        'type',
        'updated_at',
      ],
    });
    debug.log('Batch insertion or update succeeded.');
  } catch (error) {
    debug.log(`Batch insertion or update failed: ${error}`);
  }
}
