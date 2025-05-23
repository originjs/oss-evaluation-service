import {
  ViewProjects,
  logger,
  OssinsightCreatorsCountries,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';
import { getCurrentDate } from '../util/util.js';

const prCountriesUrl =
  'https://api.ossinsight.io/q/analyze-pull-request-creators-map?repoId=:repoId';
const starCountriesUrl =
  'https://api.ossinsight.io/q/analyze-stars-map?repoId=:repoId&period=all_times';
const issueCountriesUrl = 'https://api.ossinsight.io/q/analyze-issue-creators-map?repoId=:repoId';

const QUERY_SQL = `
    select distinct project.p_id,
                    project.name,
                    project.full_name as fullName
    from view_projects project
             left join (select *
                        from ossinsight_creators_countries
                        where updated_at >= :startDate) country on project.p_id = country.p_id
    where isnull(country.p_id)
    order by p_id;
`;

const QUERY_SINGLE_SQL = `
    select distinct project.p_id,
                    project.name,
                    project.full_name as fullName
    from view_projects project
             left join (select *
                        from ossinsight_creators_countries
                        where updated_at >= :startDate) country on project.p_id = country.p_id
    where isnull(country.p_id)
      and project.p_id = :pId
    order by p_id;
`;

const integrationInfo = {
  prCountries: { type: 0, url: prCountriesUrl },
  starCountries: { type: 1, url: starCountriesUrl },
  issueCountries: { type: 2, url: issueCountriesUrl },
};

/**
 * Synchronizes the countries data for all projects.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<void>} A promise that resolves when the synchronization is complete.
 */
export async function syncAllProjectCreatorsCountriesHandler(req, res) {
  const { startDate, minId, maxId } = req.body;
  const options = {
    startDate: startDate,
    minId: minId,
    maxId: maxId,
  };
  await syncAllProjectCreatorsCountries(options);

  res.status(200).json('ok');
}

/**
 * Synchronizes the creators countries data for a single project.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {Promise<void>} A promise that resolves when the synchronization is complete.
 */
export async function syncSingleProjectCreatorsCountriesHandler(req, res) {
  const { repoUrl } = req.body;
  let project = await ViewProjects.findOne({
    where: {
      htmlUrl: repoUrl,
    },
    attributes: ['pId', 'fullName'],
  });
  await syncSingleProjectCreatorsCountries(project);
  res.status(200).json('ok');
}

/**
 * Synchronizes the pull request creators countries data for a single project.
 *
 * @param {Object} project - The Github project data.
 * @return {Promise<void>} A promise that resolves when the synchronization is complete.
 */
export async function syncSingleProjectCreatorsCountries(project) {
  let countryList = [];
  for (let option of Object.values(integrationInfo)) {
    countryList = await getCreatorsCountries(project, option);
    if (countryList.length > 0) {
      await bulkInsertData(countryList);
    }
  }
}

/**
 * Synchronizes the pull request creators countries data for all projects.
 *
 * @param {Object} options - The options for synchronization.
 * @param {number} [options.pId] - The ID of the project.
 * @param {string} [options.startDate] - The start date for synchronization. Defaults to '2020-01-01'.
 * @return {Promise<void>} A promise that resolves when all the data has been synchronized.
 */
export async function syncAllProjectCreatorsCountries(options) {
  const startDate = options?.startDate || getCurrentDate();
  const projectList = await sequelize.query(options.pId ? QUERY_SINGLE_SQL : QUERY_SQL, {
    replacements: { startDate, pId: options?.pId },
    type: sequelize.QueryTypes.SELECT,
  });
  for (let project of projectList) {
    if (project && project.pId) {
      await syncSingleProjectCreatorsCountries(project);
    }
  }
}

async function getCreatorsCountries(project, option) {
  const res = [];
  const result = await sendRequestByFullName(project.pId, option.url);
  const countryList = result?.data;
  if (countryList === null || countryList === undefined || countryList.length === 0) {
    logger.info(
      'sync project data from ossinsight, data not found!',
      project.fullName,
      project.pId,
      option.url,
    );
  } else {
    countryList.forEach(el => {
      res.push({
        pId: project.pId,
        country_code: el.country_or_area,
        creators_num: getCreatorsNum(el, option.type),
        percentage: el.percentage,
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
    return el.count;
  }
  if (type === 1) {
    return el.count;
  }
  if (type === 2) {
    return el.count;
  }
}

async function sendRequestByFullName(repoId, url) {
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
      await OssinsightCreatorsCountries.destroy(
        {
          where: {
            p_id: data[0]?.pId,
            type: data[0]?.type,
          },
        },
        { transaction: t },
      );
      await OssinsightCreatorsCountries.bulkCreate(
        data,
        {
          updateOnDuplicate: [
            'p_id',
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
