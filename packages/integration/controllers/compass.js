import { gql, request } from 'graphql-request';
import debug from 'debug';
import { CompassActivity, GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';

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

export async function syncProjectCompassMetricHandler(req, res) {
  const { repoUrl, beginDate, startIndex } = req.body;
  const fullIntegration = repoUrl === undefined || repoUrl === null || repoUrl === '';

  if (fullIntegration) {
    await syncAllProjectCompassMetric({ startIndex, beginDate })
      .then(() => {
        res.status(200).send('Full-scale compass activity metrics integration success');
      })
      .catch(err => {
        res.status(500).send(`Full-scale compass activity metrics integration failure: ${err}`);
      });
  } else {
    const project = await getProjectByUrl(repoUrl);

    await syncSingleProjectCompassMetric(project, { beginDate: beginDate })
      .then(() => {
        res.status(200).send('Full-scale compass activity metrics integration success');
      })
      .catch(err => {
        res.status(500).send(`Full-scale compass activity metrics integration failure: ${err}`);
      });
  }
}

/**
 * Synchronize Single Project Compass Metric
 * @param {Object} project project info
 * @param {Object} options
 * @param {string} [options.beginDate] - compass integrate date
 * @returns {Promise<*>} inserted compass metrics
 */
export async function syncSingleProjectCompassMetric(project, options) {
  const { beginDate } = options;

  const compassData = await request(compassUrl, query, {
    label: project.htmlUrl,
    beginDate,
  }).catch(error => {
    debug.log('Post to compass error : ', error.message);
    throw error;
  });

  // Retrieve the latest 8 elements after deduplication
  const activityMetrics = Array.from(
    new Map(compassData.metricActivity.map(item => [item.grimoireCreationDate, item])).values(),
  ).slice(-8);

  // Compass metric does not exist
  if (activityMetrics.length === 0) {
    debug.log('compass metric is empty, project: ', project.htmlUrl);
  }

  const compassActivityList = await getIncrementalIntegrationArray(
    project.htmlUrl,
    project.id,
    activityMetrics,
  );
  if (compassActivityList.length === 0) {
    debug.log('There is no new compass data that needs to be inserted');
  }

  await CompassActivity.bulkCreate(compassActivityList)
    .then(compass => {
      debug.log(`insert into database: ${compass.length}`);
    })
    .catch(error => {
      debug.log('Batch insert error: ', error.message);
    });
  return compassActivityList;
}

/**
 *
 * @param {Object} options
 * @param {number} [options.startIndex] Control the integration schedule of the project
 * @param {string} [options.beginDate] compass integrate date
 * @returns {Promise<void>}
 */
export async function syncAllProjectCompassMetric(options) {
  const { startIndex, beginDate } = options;
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
    await syncSingleProjectCompassMetric(project, { beginDate });
  }
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
