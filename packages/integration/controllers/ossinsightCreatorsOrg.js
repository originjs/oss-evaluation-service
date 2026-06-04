import {
  ViewProjects,
  logger,
  OssinsightCreatorsOrganizations,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';
import { getCurrentDate } from '../util/util.js';
import { platformTypes } from '@orginjs/oss-evaluation-util';

const prOrganizationsUrl =
  'https://api.ossinsight.io/q/analyze-pull-request-creators-company?repoId=:repoId&limit=50';
const starOrganizationsUrl =
  'https://api.ossinsight.io/q/analyze-stars-company?repoId=:repoId&limit=50';
const issueOrganizationsUrl =
  'https://api.ossinsight.io/q/analyze-issue-creators-company?repoId=:repoId&limit=50';

const QUERY_SQL = `
    select distinct project.p_id,
                    project.name,
                    project.full_name     as fullName,
                    project.id,
                    project.platform_type as platformType
    from view_projects project
             left join (select *
                        from ossinsight_creators_organizations
                        where updated_at >= :startDate) organization on project.p_id = organization.p_id
    where isnull(organization.p_id)
    order by p_id;
`;

const QUERY_SINGLE_SQL = `
    select distinct project.p_id,
                    project.name,
                    project.full_name     as fullName,
                    project.id,
                    project.platform_type as platformType
    from view_projects project
             left join (select *
                        from ossinsight_creators_organizations
                        where updated_at >= :startDate) organization on project.p_id = organization.p_id
    where isnull(organization.p_id)
      and project.p_id = :pId
    order by p_id;
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
  const options = {
    startDate: startDate,
    minId: minId,
    maxId: maxId,
  };
  await syncAllProjectCreatorsOrg(options);

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
  let project = await ViewProjects.findOne({
    where: {
      htmlUrl: repoUrl,
    },
    attributes: ['pId', 'fullName', 'id', 'platformType'],
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
  if (project.platformType !== platformTypes.GITHUB) {
    logger.warn(`project:${project.fullName} is not support, skip syncSingleProjectCreatorsOrg!`);
    return;
  }
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
 * @param {Object} options - The options for the synchronization.
 * @param {number} [options.pId] - The project ID to start the synchronization.
 * @param {string} [options.startDate='2020-01-01'] - The start date for the synchronization.
 * @return {Promise<void>} A promise that resolves when the synchronization is complete.
 */
export async function syncAllProjectCreatorsOrg(options) {
  const startDate = options?.startDate || getCurrentDate();

  const projectList = await sequelize.query(options?.pId ? QUERY_SINGLE_SQL : QUERY_SQL, {
    replacements: { startDate, pId: options?.pId },
    type: sequelize.QueryTypes.SELECT,
  });
  for (let project of projectList) {
    if (project && project.pId) {
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
      project.pId,
      option.url,
    );
  } else {
    organizationList.forEach(el => {
      res.push({
        pId: project.pId,
        org_name: el.company_name,
        creators_num: getCreatorsNum(el, option.type),
        percentage: el.proportion,
        type: option.type,
      });
    });
    logger.info(
      'sync project data from ossinsight, successful!',
      project.fullName,
      project.pId,
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
            pId: data[0]?.pId,
            type: data[0]?.type,
          },
        },
        { transaction: t },
      );
      await OssinsightCreatorsOrganizations.bulkCreate(
        data,
        {
          updateOnDuplicate: [
            'pId',
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
