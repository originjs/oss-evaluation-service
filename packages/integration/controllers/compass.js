import { gql, request } from 'graphql-request';
import {
  CompassActivity,
  ViewProjects,
  logger,
  sequelizeExt,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl, sleep } from '../util/util.js';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';
import dayjs from 'dayjs';

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
  const fullIntegration = !repoUrl;

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
  // no date default current subtract six month
  const beginDate =
    options?.beginDate ?? dayjs(new Date()).subtract(6, 'month').format('YYYY-MM-DD');
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
    project.pId,
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
  let projectList = await ViewProjects.findAll({
    attributes: ['pId', 'htmlUrl'],
  });
  const projectCount = projectList.length;

  projectList = projectList.slice(startIndex);
  logger.info(
    `Compass: This round needs to integrate projects: ${projectList.length}, and project count: ${projectCount}`,
  );
  let count = startIndex ?? 0;

  for (const project of projectList) {
    logger.info(`Compass integration - Current Progress: ${count + 1} / ${projectCount}`);
    count += 1;
    await syncSingleProjectCompassMetric(project, { beginDate }).catch(err => {
      throw { error: err, startIndex: count };
    });
  }
}

async function getIncrementalIntegrationArray(repoUrl, pId, activityMetrics) {
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
      activity.pId = pId;
      activity.repoUrl = activity.label;
      compassMetricsList.push(activity);
    }
  }
  return compassMetricsList;
}

export async function compassSchedulerHandler(req, res) {
  await compassScheduler(parseInt(req.query.startIndex), parseInt(req.query.maxRetries));
  res.status(200).json('ok');
}

export async function compassScheduler(startIndex = 0, maxRetries = 3, currentAttempt = 1) {
  const beginDate = dayjs(new Date()).subtract(6, 'month').format('YYYY-MM-DD');
  try {
    let startTime = process.hrtime();
    logger.info('[Integration][Compass] Compass Integration Job start');
    await syncAllProjectCompassMetric({ startIndex, beginDate });
    logger.info('[Integration][Compass] Compass integration Successful!');
    let endTime = process.hrtime(startTime);
    logger.info(
      `[Integration] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
    );
  } catch (err) {
    if (currentAttempt >= maxRetries) {
      logger.error('[Integration][Compass] Maximum number of retries: Integration Failure ');
      logger.error('Max retries reached. Giving up.');
      logger.error(`currentAttempt:${currentAttempt}, maxRetries:${maxRetries}`);
      return;
    }
    logger.info(`Retrying... (${currentAttempt + 1}/${maxRetries})`);
    // Customize the error, continue running from startIndex
    if (Object.prototype.hasOwnProperty.call(err, 'startIndex')) {
      const { error, startIndex } = err;
      if (
        Object.prototype.hasOwnProperty.call(error, 'response') &&
        error.response.status === 429
      ) {
        logger.error(
          `[Integration][Compass] Compass integrates flow limiting, waits 1 hour and restarts the timer, and current process: ${startIndex}`,
        );
        await sleep(3600001);
        await compassScheduler(startIndex, maxRetries, currentAttempt);
      } else {
        logger.error('[Integration][Compass] Unknown error occurs, wait 10s and re-execute');
        await sleep(10000);
        await compassScheduler(startIndex, maxRetries, currentAttempt + 1);
      }
    } else if (
      // Sequelize error, just exit
      Object.prototype.hasOwnProperty.call(err, 'name') &&
      err.name.includes('Sequelize')
    ) {
      logger.error('[Integration][Compass] Sequelize error, please check your database config');
    } else {
      logger.error('[Integration][Compass] compass integration unknown error, please checks');
    }
  }
}

// Add monitoring to all task functions in your scheduled task
export const compassTimer = addMonitoringToTask(compassScheduler, 'compassTimer', 'compassTimer');

export async function syncAllProjectCompassSubstituteHandler(req, res) {
  await syncAllProjectCompassSubstitute();
  res.status(200).json('ok');
}

async function syncAllProjectCompassSubstitute() {
  logger.info('syncAllProjectCompassSubstitute start');
  logger.info('Add full_name field');
  const sql1 = `
      update \`oss-eval-inner\`.compass_activity_detail_substitute detail
      set full_name = substring_index(detail.repo_url, 'https://github.com/', -1)
      where isnull(p_id);
  `;
  await sequelizeExt.query(sql1, { type: sequelize.QueryTypes.UPDATE });

  logger.info('Add p_id field');
  const sql2 = `
      update \`oss-eval-inner\`.compass_activity_detail_substitute detail
          inner join \`oss-eval\`.view_projects projects on detail.repo_url = html_url
      set detail.p_id = projects.p_id
      where isnull(p_id);
  `;
  await sequelizeExt.query(sql2, { type: sequelize.QueryTypes.UPDATE });

  logger.info('enrich evaluation_summary field');
  const sql3 = `
      update \`oss-eval\`.oss_evaluation_summary t1 inner join
          (select a.*
           from \`oss-eval-inner\`.compass_activity_detail_substitute a,
                (select pId, Max(grimoire_creation_date) grimoire_creation_date
                 from \`oss-eval-inner\`.compass_activity_detail_substitute
                 group by pId) b
           where a.pId = b.pId
             and a.grimoire_creation_date = b.grimoire_creation_date) t2 on t1.pId = t2.pId
      set t1.contributor_count     = t2.contributor_count,
          t1.closed_issues_count   = t2.closed_issues_count,
          t1.commit_frequency      = t2.commit_frequency,
          t1.comment_frequency     = t2.comment_frequency,
          t1.code_review_count     = t2.code_review_count,
          t1.org_count             = t2.org_count,
          t1.updated_issues_count  = t2.updated_issues_count,
          t1.recent_releases_count = t2.recent_releases_count
  `;

  await sequelizeExt.query(sql3, { type: sequelize.QueryTypes.UPDATE });

  logger.info('syncAllProjectCompassSubstitute finished');
}
