import { request, gql } from 'graphql-request';
import debug from 'debug';
import { GithubProjects, CompassActivity } from '@orginjs/oss-evaluation-data-model';
import { Cron } from 'croner';

import { sleep } from '../util/util.js';

const query = gql`
  query MetricActivity(
    $label: String!
    $level: String
    $beginDate: ISO8601DateTime
    $endDate: ISO8601DateTime
  ) {
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

export default syncCompassActivityMetric;

const integrationTime = '@weekly';
let start = 0;

const compassIntegrateJob = new Cron(integrationTime, { timezone: 'Etc/UTC' }, async () => {
  debug.log('compass integration start!', compassIntegrateJob.getPattern());
  try {
    await syncFullProjectCompassMetric(start);
    debug.log('Synchronous compass successful!');
  } catch (err) {
    if (err.name === 'SequelizeConnectionError') {
      debug.log('An Sequelize error occurred');
    } else {
      const { error, startIndex } = err;
      start = startIndex;
      debug.log(error);
      if (
        Object.prototype.hasOwnProperty.call(error, 'response') &&
        error.response.status === 429
      ) {
        debug.log('The server returns 429 rate limit, try again after one hour.');
        await sleep(3600000);
        await compassIntegrateJob.trigger();
      } else {
        debug.log('An error occurred, start trying again');
        await sleep(10000);
        await compassIntegrateJob.trigger();
      }
    }
  }
});

/**
 * Synchronize single project compass activity metric to Database
 */
export async function syncCompassActivityMetric(req, res) {
  const { repoUrl, beginDate, startIndex } = req.body;
  const fullIntegration = repoUrl === undefined || repoUrl === null || repoUrl === '';

  if (fullIntegration) {
    await syncFullProjectCompassMetric(startIndex);
    res.status(200).send('Full-scale compass activity metrics integration success');
  } else {
    await syncSingleProjectCompassMetric({ repoUrl, beginDate });
    res.status(200).send(`Project: ${repoUrl} - compass activity metrics integration success`);
  }
}

/**
 * Synchronize compass data for all GitHub projects
 * @param startIndex Prevent intermediate failed checkpoints
 */
async function syncFullProjectCompassMetric(startIndex) {
  let projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl'],
  });
  const projectCount = projectList.length;
  debug.log(`The Number of Project : ${projectCount}`);

  projectList = projectList.slice(startIndex);
  debug.log(`This round needs to synchronize the total number of projects: ${projectList.length}`);
  let count = startIndex;

  for (const project of projectList) {
    debug.log('**Current Progress**: ', `${count + 1}/${projectCount}`);
    count += 1;

    debug.log('Request compass metric');
    const compassData = await request(compassUrl, query, {
      label: project.htmlUrl,
    }).catch(error => {
      debug.log('Post to compass error : ', error.message);
      throw { error, startIndex: count - 1 };
    });

    const activityMetrics = compassData.metricActivity.slice(-8);

    // Compass metric does not exist
    if (activityMetrics.length === 0) {
      debug.log('compass metric is empty, project: ', project.htmlUrl);
      continue;
    }

    const compassActivityList = await getIncrementalIntegrationArray(
      project.htmlUrl,
      project.id,
      activityMetrics,
    );

    if (compassActivityList.length === 0) {
      debug.log('There is no new compass data that needs to be inserted');
      continue;
    }

    await CompassActivity.bulkCreate(compassActivityList)
      .then(compass => {
        debug.log(`Insert ${compass.length} Compass metrics`);
      })
      .catch(error => {
        debug.log('Batch insert error: ', error.message);
        throw { error, startIndex: count - 1 };
      });
  }
}

async function syncSingleProjectCompassMetric(repoUrl, beginDate) {
  const project = await GithubProjects.findOne({
    where: {
      html_url: repoUrl,
    },
  });

  if (project === null) {
    debug.log('The project has no project id');
    return;
  }

  // check if the project has saved in database
  const databaseItem = await CompassActivity.findOne({
    where: {
      repoUrl: project.htmlUrl,
    },
  });
  if (databaseItem != null) {
    debug.log('Project have been saved in database');
    return;
  }

  const data = await request(compassUrl, query, {
    label: repoUrl,
    beginDate,
  });
  const metrics = data.metricActivity;
  if (metrics.length === 0) {
    debug.log('The project: ', repoUrl, ' has no compass metric');
    return;
  }

  const compassActivityList = await getIncrementalIntegrationArray(repoUrl, project.id, metrics);
  await CompassActivity.bulkCreate(compassActivityList)
    .then(compass => {
      debug.log('insert into database: ', compass.length);
    })
    .catch(error => {
      debug.log('Batch insert error: ', error.message);
    });
}

async function getIncrementalIntegrationArray(repoUrl, projectId, activityMetrics) {
  const existCompassDateList = await CompassActivity.findAll({
    attributes: ['grimoireCreationDate'],
    where: {
      repoUrl,
    },
  }).then(compass => compass.map(date => date.dataValues.grimoireCreationDate.getTime()));

  const compassMetricsList = [];
  for (const activity of activityMetrics) {
    // incremental integration
    const activityDate = new Date(activity.grimoireCreationDate).getTime();
    if (!existCompassDateList.includes(activityDate)) {
      activity.id = 0;
      activity.hasCompassMetric = 1;
      activity.projectId = projectId;
      activity.repoUrl = activity.label;
      compassMetricsList.push(activity);
    }
  }
  return compassMetricsList;
}
