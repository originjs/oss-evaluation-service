import {
  GithubProjects,
  OssinsightPullRequestCreatorsCountries,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import fetch from '@adobe/node-fetch-retry';
import debug from 'debug';

const QUERY_SQL = `
select distinct project.id,
                project.name,
                project.full_name as fullName,
                project.html_url  as htmlUrl,
                project_id        as projectId
from github_projects project
         left join (select *
                    from ossinsight_pull_request_creators_countries
                    where updated_at >= :startDate) country on project.id = project_id
where isnull(project_id)
order by id;
`;

/**
 * Synchronizes the pull request creators countries data for all projects from ossinsight.
 *
 * @param {Object} req - The request object containing the body with the startDate.
 * @param {Object} res - The response object.
 * @return {Promise<void>} A promise that resolves when all the data has been synchronized.
 */
export async function syncAllProjectPullRequestCreatorsCountriesHandler(req, res) {
  const { startDate } = req.body;
  const projectList = await sequelize.query(QUERY_SQL, {
    replacements: { startDate },
    type: sequelize.QueryTypes.SELECT,
  });

  await syncAllProjectPullRequestCreatorsCountries(projectList);
  res.status(200).json('ok');
}

/**
 * Handles the request to synchronize the pull request creators countries data for a single project.
 *
 * @param {Object} req - The request object containing the body with the repoUrl.
 * @param {Object} res - The response object.
 * @return {Promise<void>} A promise that resolves when the synchronization is complete.
 */
export async function syncSingleProjectPullRequestCreatorsCountriesHandler(req, res) {
  const { repoUrl } = req.body;
  let project = await GithubProjects.findOne({
    where: {
      htmlUrl: repoUrl,
    },
    attributes: ['id', 'fullName'],
  });
  await syncSingleProjectPullRequestCreatorsCountries(project);
  res.status(200).json('ok');
}

/**
 * Sync single project pull request creators countries data from ossinsight
 *
 * @param {Object} project - Github project data
 */
export async function syncSingleProjectPullRequestCreatorsCountries(project) {
  const countrieyList = await getPullRequestCreatorsCountries(project);
  if (countrieyList === null || countrieyList === undefined || countrieyList.length === 0) {
    debug.log(
      'sync project pull request creators countries data from ossinsight! project:{}  fullName{}',
      project.id,
      project.fullName,
    );
  } else {
    bulkUpsertData(countrieyList);
  }
}

/**
 * Synchronizes the pull request creators countries data for all projects from ossinsight.
 *
 * @param {Array} projectList - An array of Github project data.
 * @return {Promise<void>} A promise that resolves when all the data has been synchronized.
 */
export async function syncAllProjectPullRequestCreatorsCountries(projectList) {
  let countryLists = [];
  for (let project of projectList) {
    if (project && project.fullName) {
      let country = await getPullRequestCreatorsCountries(project);
      if (country === null || country === undefined || country.length === 0) {
        debug.log(
          'sync project pull request creators countries data from ossinsight! project:{}  fullName{}',
          project.id,
          project.fullName,
        );
        continue;
      }
      countryLists.push(...country);
    }
    if (countryLists.length > 500) {
      bulkUpsertData(countryLists);
      countryLists = [];
    }
  }

  bulkUpsertData(countryLists);
}

async function getPullRequestCreatorsCountries(project) {
  const result = await sendRequestByFullName(project.fullName);
  const countryList = result.data.rows;
  if (countryList && countryList.length > 0) {
    const res = [];
    countryList.forEach(el => {
      res.push({
        project_id: project.id,
        country_code: el.country_code,
        pull_request_creators: el.pull_request_creators,
        percentage: el.percentage,
      });
    });
    return res;
  }
}

export async function sendRequestByFullName(fullName) {
  debug.log(`https://api.ossinsight.io/v1/repos/${fullName}/pull_request_creators/countries/`);

  const url = `https://api.ossinsight.io/v1/repos/${fullName}/pull_request_creators/countries/`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    retryOptions: {
      retryMaxDuration: 7200000, // 120 min retry duration
      retryInitialDelay: 100,
    },
  });
  if (response.ok) {
    return response.json();
  }
  return {
    error: `fetch Stargazers Trend failed:: ${response.statusText}`,
  };
}

async function bulkUpsertData(data) {
  try {
    await OssinsightPullRequestCreatorsCountries.bulkCreate(data, {
      updateOnDuplicate: [
        'project_id',
        'country_code',
        'pull_request_creators',
        'percentage',
        'updated_at',
      ],
    });
    debug.log('Batch insertion or update succeeded.');
  } catch (error) {
    debug.log(`Batch insertion or update failed: ${error}`);
  }
}
