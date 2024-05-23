import { gql, request } from 'graphql-request';
import { CompassActivity, GithubProjects, logger } from '@orginjs/oss-evaluation-data-model';
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
        logger.error(`Full-scale compass activity metrics integration failure: ${err}`);
        res.status(500).send(`Full-scale compass activity metrics integration failure: ${err}`);
      });
  } else {
    const project = await getProjectByUrl(repoUrl);

    await syncSingleProjectCompassMetric(project, { beginDate: beginDate })
      .then(() => {
        res.status(200).send('Full-scale compass activity metrics integration success');
      })
      .catch(err => {
        logger.error(`Full-scale compass activity metrics integration failure: ${err}`);
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
    logger.error('Post to compass error : ' + error.message);
    throw error;
  });

  // Retrieve compass data from a year ago
  const activityMetrics = Array.from(
    new Map(compassData.metricActivity.map(item => [item.grimoireCreationDate, item])).values(),
  );

  // Compass metric does not exist
  if (activityMetrics.length === 0) {
    logger.info(`compass metric is empty, project: ${project.htmlUrl}`);
  }

  const compassActivityList = await getIncrementalIntegrationArray(
    project.htmlUrl,
    project.id,
    activityMetrics,
  );
  if (compassActivityList.length === 0) {
    logger.info('There is no new compass data that needs to be inserted');
  }

  await CompassActivity.bulkCreate(compassActivityList)
    .then(compass => {
      logger.info(`insert compass metrics: ${compass.length}`);
    })
    .catch(error => {
      logger.info(`Error occurs when batch inserting compass data: ${error.message}`);
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

  projectList = projectList.slice(startIndex);
  logger.info(
    `Compass: This round needs to integrate projects: ${projectList.length}, and project count: ${projectCount}`,
  );
  let count = startIndex;

  for (const project of projectList) {
    logger.info(`Compass integration - Current Progress: ${count + 1} / ${projectCount}`);
    count += 1;
    await syncSingleProjectCompassMetric(project, { beginDate }).catch(err => {
      throw { error: err, startIndex: count };
    });
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
