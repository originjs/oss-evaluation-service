import {
  GithubProjects,
  OssinsightCreatorsCountries,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';
import debug from 'debug';

const issueCountriesUrl =
  'https://api.ossinsight.io/v1/repos/:owner/:repo/issue_creators/countries/';
const prCountriesUrl =
  'https://api.ossinsight.io/v1/repos/:owner/:repo/pull_request_creators/countries';
const starCountriesUrl = 'https://api.ossinsight.io/v1/repos/:owner/:repo/stargazers/countries/';

const QUERY_SQL = `
  select distinct project.id,
                  project.name,
                  project.full_name as fullName
  from github_projects project
           left join (select *
                      from ossinsight_creators_countries
                      where updated_at >= :startDate and type = :type) country on project.id = project_id
  where isnull(project_id)
  and project.id >= :startId
  and project.id <= :endId
  order by id;
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
  let startId = minId || (await GithubProjects.min('id'));
  let endId = maxId || (await GithubProjects.max('id'));

  for (let option of Object.values(integrationInfo)) {
    const projectList = await sequelize.query(QUERY_SQL, {
      replacements: { startDate, startId, endId, type: option.type },
      type: sequelize.QueryTypes.SELECT,
    });
    await syncAllProjectCreatorsCountries(projectList, option);
  }

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
  let project = await GithubProjects.findOne({
    where: {
      htmlUrl: repoUrl,
    },
    attributes: ['id', 'fullName'],
  });
  for (let option of Object.values(integrationInfo)) {
    await syncSingleProjectCreatorsCountries(project, option);
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
export async function syncSingleProjectCreatorsCountries(project, option) {
  const countryList = await getCreatorsCountries(project, option);
  await bulkUpsertData(countryList);
}

/**
 * Synchronizes the pull request creators organizations data for all projects.
 *
 * @param {Array} projectList - An array of Github project data.
 * @param {Object} option - The options for getting the creators organizations.
 * @return {Promise<void>} A promise that resolves when all the data has been synchronized.
 */
export async function syncAllProjectCreatorsCountries(projectList, option) {
  let countryLists = [];
  for (let project of projectList) {
    if (project && project.fullName) {
      let country = await getCreatorsCountries(project, option);
      if (country.length === 0) {
        continue;
      }
      countryLists.push(...country);
    }
    if (countryLists.length > 1000) {
      await bulkUpsertData(countryLists);
      countryLists = [];
    }
  }

  await bulkUpsertData(countryLists);
}

async function getCreatorsCountries(project, option) {
  const res = [];
  const result = await sendRequestByFullName(project.fullName, option.url);
  const countryList = result?.data?.rows;
  if (countryList === null || countryList === undefined || countryList.length === 0) {
    debug.log('sync project data from ossinsight, data not found!', project.fullName, option.url);
  } else {
    countryList.forEach(el => {
      res.push({
        project_id: project.id,
        country_code: el.country_code,
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

async function sendRequestByFullName(fullName, url) {
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
    await OssinsightCreatorsCountries.bulkCreate(data, {
      updateOnDuplicate: [
        'project_id',
        'country_code',
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
