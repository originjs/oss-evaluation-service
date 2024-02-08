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

  const project = await GithubProjects.findOne({
    where: {
      html_url: variables.label,
    },
  });

  if (project === null) {
    res.status(200).send('The project has no project id');
    return;
  }

  const data = await request(
    compassUrl,
    query,
    variables,
  );
  const metrics = data.metricActivity;
  if (metrics.length === 0) {
    res.status(200).send('The project: ', variables.htmlUrl, ' has no compass metric');
    return;
  }

  const existCompassDateList = await CompassActivity.findAll({
    attributes: ['grimoireCreationDate'],
    where: {
      repo_url: variables.label,
    },
  }).then((dateList) => dateList.map((compassDate) => compassDate.dataValues.grimoireCreationDate.getTime()));

  const compassActivityList = [];
  for (const activity of metrics) {
    // incremental integration
    const activityDate = new Date(activity.grimoireCreationDate).getTime();
    if (!existCompassDateList.includes(activityDate)) {
      activity.id = 0;
      activity.projectId = project.id;
      activity.repoUrl = activity.label;
      compassActivityList.push(activity);
    }
  }

  await CompassActivity.bulkCreate(compassActivityList).then((compass) => {
    debug.log('insert into database: ', compass.length);
  }).catch((error) => {
    debug.log('Batch insert error: ', error.message);
  });

  res.status(200).send('sync:compass: ', variables.htmlUrl, ' - compass metric insert into database success!');
}

/**
 *  Synchronize all compass metric to database
 */
export async function syncMetricActivity(req, res) {
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl'],
  });

  for (const projectListItem of projectList) {
    const project = projectListItem.dataValues;

    const data = await request(
      compassUrl,
      query,
      {
        label: project.htmlUrl,
        beginDate: req.body.beginDate,
      },
    ).catch((error) => {
      debug.log('Post to compass error : ', error.message);
    });

    const metricList = data.metricActivity;
    if (metricList.length === 0) {
      debug.log('compass metric is empty, project: ', project.htmlUrl);
      continue;
    }

    const existCompassDateList = await CompassActivity.findAll({
      attributes: ['grimoireCreationDate'],
      where: {
        repo_url: project.htmlUrl,
      },
    }).then((dateList) => dateList.map((compassDate) => compassDate.dataValues.grimoireCreationDate.getTime()));

    const compassActivityList = [];

    for (const activity of metricList) {
      // incremental integration
      const activityDate = new Date(activity.grimoireCreationDate).getTime();
      if (!existCompassDateList.includes(activityDate)) {
        activity.id = 0;
        activity.projectId = project.id;
        activity.repoUrl = activity.label;
        compassActivityList.push(activity);
      }
    }

    await CompassActivity.bulkCreate(compassActivityList).then((compass) => {
      debug.log('insert into database: ', compass.length);
    }).catch((error) => {
      debug.log('Batch insert error: ', error.message);
    });
  }

  res.status(200).send('compass data sync success!');
}
