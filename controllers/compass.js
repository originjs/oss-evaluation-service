import { request, gql } from 'graphql-request';
import debug from 'debug';
import CompassActivity from '../models/CompassActivity.js';
import GithubProjects from '../models/GithubProjects.js';

const query = gql`
    query MetricActivity($label: String!, $level: String, $beginDate: ISO8601DateTime, $endDate: ISO8601DateTime) {
      metricActivity(label: $label, level: $level, beginDate: $beginDate, endDate: $endDate) {
        label
        activityScore
        closedIssuesCount
        codeReviewCount
        commentFrequency
        commitFrequency
        contributorCount
        orgCount
        recentReleasesCount
        updatedIssuesCount
        grimoireCreationDate
      }
    }
  `;

const compassUrl = 'https://oss-compass.org/api/graphql';

/**
 * get single project compass data
 */
export async function getMetricActivity(req, res) {
  const data = await request(
    'https://oss-compass.org/api/graphql',
    query,
    req.body,
  );
  res.status(200).json(data);
}

/**
 * Synchronize single project compass activity metric to Database
 */
export async function syncSingleMetricActivity(req, res) {
  const variables = req.body;

  const projectId = await GithubProjects.findOne({
    where: {
      html_url: variables.label,
    },
  }).then((project) => {
    if (project === null) {
      return null;
    }
    return project.dataValues.id;
  });

  if (projectId === null) {
    res.status(200).send('the project has no project id');
    return;
  }

  const data = await request(
    compassUrl,
    query,
    variables,
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
    },
  );

  const metrics = data.metricActivity;
  if (metrics.length === 0) {
    res.status(200).send('The project: ', variables.htmlUrl, ' has no compass metric');
    return;
  }

  // get the newest compass time
  const existCompassDateList = await CompassActivity.findAll({
    attributes: ['grimoire_creation_date'],
    where: {
      repo_url: variables.label,
    },
  });
  const compassActivityList = [];
  for (const activity of metrics) {
    if (!existCompassDateList.includes(activity.grimoireCreationDate)) {
      activity.id = 0;
      activity.projectId = projectId;
      activity.repoUrl = activity.label;
      compassActivityList.push(activity);
    }
  }

  await bulkInsertCompassData(compassActivityList).catch((error) => {
    throw error;
  });

  res.status(200).send('success');
}

/**
 *  Synchronize all compass metric to database
 */
export async function syncMetricActivity(req, res) {
  // get github project info
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl'],
  });

  for (const projectListItem of projectList) {
    const project = projectListItem.dataValues;

    // post request to compass
    const data = await request(
      compassUrl,
      query,
      {
        label: project.htmlUrl,
        beginDate: req.body.beginDate,
      },
    ).catch((error) => {
      debug.log('erro message: ', error.message);
    });

    const metricList = data.metricActivity;
    if (metricList.length === 0) {
      debug.log('compass metric is empty, project: ', project.htmlUrl);
      continue;
    }
    const compassActivityList = [];

    for (const activity of metricList) {
      activity.id = 0;
      activity.projectId = project.id;
      activity.repoUrl = activity.label;
      compassActivityList.push(activity);
    }
    // 批量集成
    bulkInsertCompassData(compassActivityList)
      .catch((error) => {
        debug.log('bulk insert error:', error);
      });
  }

  res.status(200).send('compass data sync success!');
}

/**
 * batch insert compass data into database
 *
 * @param compassMetricList compass data list
 * @returns {Promise<void>}
 */
async function bulkInsertCompassData(compassMetricList) {
  if (compassMetricList.length === 0) {
    return;
  }
  await CompassActivity.bulkCreate(compassMetricList).then((compass) => {
    debug.log('batch insert: ', compass.length);
  }).catch((error) => {
    debug.log('batch insert failure: ', error.message);
  });
}
