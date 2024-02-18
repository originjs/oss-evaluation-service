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

export default syncCompassActivityMetric;

/**
 * Synchronize single project compass activity metric to Database
 */
export async function syncCompassActivityMetric(req, res) {
  const { repoUrl, beginDate } = req.body;
  if (beginDate === undefined || beginDate === null || beginDate === '') {
    res.status(200).send('Synchronize date must be provided');
  }
  const fullIntegration = repoUrl === undefined || repoUrl === null || repoUrl === '';

  if (fullIntegration) {
    await syncFullProjectCompassMetric(beginDate);
    res.status(200).send('Full-scale compass activity metrics integration success');
  } else {
    await syncSingleProjectCompassMetric({ repoUrl, beginDate });
    res.status(200).send(`Project: ${repoUrl} - compass activity metrics integration success`);
  }
}

async function syncFullProjectCompassMetric(beginDate) {
  const projectList = await GithubProjects.findAll({
    attributes: ['id', 'htmlUrl'],
  });
  debug.log(`The Number of Project : ${projectList.length}`);
  let count = 1;

  for (const projectListItem of projectList) {
    debug.log('**Current Progress**: ', `${count}/${projectList.length}`);
    count += 1;

    const project = projectListItem.dataValues;

    // check if the project has saved in database
    const databaseItem = await CompassActivity.findOne({
      where: {
        repoUrl: project.htmlUrl,
      },
    });

    debug.log('Request compass metric');
    // request compass metric
    const data = await request(
      compassUrl,
      query,
      {
        label: project.htmlUrl,
        beginDate,
      },
    ).catch((error) => {
      debug.log('Post to compass error : ', error.message);
    });

    const metrics = data.metricActivity;

    // Compass metric does not exist
    if (metrics.length === 0) {
      await CompassActivity.create({
        id: 0,
        projectId: project.id,
        repoUrl: project.htmlUrl,
        hasCompassMetric: 0,
      });
      debug.log('compass metric is empty, project: ', project.htmlUrl);
      continue;
    }

    const compassActivityList = await getIncrementalIntegrationArray(
      project.htmlUrl,
      project.id,
      metrics,
    );

    await CompassActivity.bulkCreate(compassActivityList).then((compass) => {
      debug.log('insert into database: ', compass.length);
    }).catch((error) => {
      debug.log('Batch insert error: ', error.message);
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

  const data = await request(
    compassUrl,
    query,
    {
      label: repoUrl,
      beginDate,
    },
  );
  const metrics = data.metricActivity;
  if (metrics.length === 0) {
    debug.log('The project: ', repoUrl, ' has no compass metric');
    return;
  }

  const compassActivityList = await getIncrementalIntegrationArray(repoUrl, project.id, metrics);
  await CompassActivity.bulkCreate(compassActivityList).then((compass) => {
    debug.log('insert into database: ', compass.length);
  }).catch((error) => {
    debug.log('Batch insert error: ', error.message);
  });
}

async function getIncrementalIntegrationArray(repoUrl, projectId, metrics) {
  const existCompassDateList = await CompassActivity.findAll({
    attributes: ['grimoireCreationDate'],
    where: {
      repoUrl,
    },
  }).then((compass) => compass.map((date) => date.dataValues.grimoireCreationDate.getTime()));

  const compassActivityList = [];
  for (const activity of metrics) {
    // incremental integration
    const activityDate = new Date(activity.grimoireCreationDate).getTime();
    if (!existCompassDateList.includes(activityDate)) {
      activity.id = 0;
      activity.hasCompassMetric = 1;
      activity.projectId = projectId;
      activity.repoUrl = activity.label;
      compassActivityList.push(activity);
    }
  }
  return compassActivityList;
}
