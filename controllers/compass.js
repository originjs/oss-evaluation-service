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
  const variables = req.body;
  const fullIntegration = 'repoUrl' in variables ? variables.repoUrl === '' || variables.repoUrl === null : true;

  if (fullIntegration) {
    await syncFullProjectCompassMetric(variables, res);
    res.status(200).send('Full-scale compass activity metrics integration success');
  } else {
    await syncSingleProjectCompassMetric(variables, res);
    res.status(200).send(`Project: ${variables.repoUrl} - compass activity metrics integration success`);
  }
}

async function syncFullProjectCompassMetric(variables) {
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
        beginDate: variables.beginDate,
      },
    ).catch((error) => {
      debug.log('Post to compass error : ', error.message);
    });

    const metrics = data.metricActivity;
    if (metrics.length === 0) {
      debug.log('compass metric is empty, project: ', project.htmlUrl);
      continue;
    }

    const compassActivityList = getIncrementalIntegrationArray({
      repoUrl: project.htmlUrl,
      beginDate: variables.beginDate,
    }, project.id, metrics);

    await CompassActivity.bulkCreate(compassActivityList).then((compass) => {
      debug.log('insert into database: ', compass.length);
    }).catch((error) => {
      debug.log('Batch insert error: ', error.message);
    });
  }
}

async function syncSingleProjectCompassMetric(variables) {
  const project = await GithubProjects.findOne({
    where: {
      html_url: variables.repoUrl,
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
      label: variables.repoUrl,
      beginDate: variables.beginDate,
    },
  );
  const metrics = data.metricActivity;
  if (metrics.length === 0) {
    debug.log('The project: ', variables.htmlUrl, ' has no compass metric');
    return;
  }

  const compassActivityList = getIncrementalIntegrationArray(variables, project.id, metrics);
  await CompassActivity.bulkCreate(compassActivityList).then((compass) => {
    debug.log('insert into database: ', compass.length);
  }).catch((error) => {
    debug.log('Batch insert error: ', error.message);
  });
}

async function getIncrementalIntegrationArray(variables, projectId, metrics) {
  const existCompassDateList = await CompassActivity.findAll({
    attributes: ['grimoireCreationDate'],
    where: {
      repo_url: variables.repoUrl,
    },
  }).then((compass) => compass.map((date) => date.dataValues.grimoireCreationDate.getTime()));

  const compassActivityList = [];
  for (const activity of metrics) {
    // incremental integration
    const activityDate = new Date(activity.grimoireCreationDate).getTime();
    if (!existCompassDateList.includes(activityDate)) {
      activity.id = 0;
      activity.projectId = projectId;
      activity.repoUrl = activity.label;
      compassActivityList.push(activity);
    }
  }
  return compassActivityList;
}
