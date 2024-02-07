import {request, gql} from 'graphql-request';
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


function sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function fetchWithRetry(task, retryInterval, maxRetryCount = 3) {
    debug.log('进入fetch函数');
    for (let i = 0; i <= maxRetryCount; i++) {
        try {
            return await task();
        } catch (error) {
            if (i < maxRetryCount) {
                debug.log(`第${i}次任务失败: ${error.message}, ${retryInterval}ms 后重试`);
                await sleep(retryInterval);
            } else {
                throw error;
            }
        }
    }
}

/**
 * get single project compass data
 */
export async function getMetricActivity(req, res, next) {
    const data = await request(
        "https://oss-compass.org/api/graphql",
        query,
        req.body
    );
    res.status(200).json(data);
}

/**
 * Synchronize single project compass activity metric to Database
 */
export async function syncSingleMetricActivity(req, res, next) {
    let variables = req.body;

    let data = await request(
        compassUrl,
        query,
        variables,
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36"
        }
    );

    let metrics = data.metricActivity;
    if (metrics.length === 0) {
        return res.status(200).send('The project has no hava compass metric');
    }

    let projectId = await GithubProjects.findOne({
            where: {
                html_url: variables.label
            }
        }
    ).then(project => {
        if (project === null) {
            debug.log('project not found');
            return -1;
        } else {
            return project.dataValues.id;
        }
    });
    if (projectId === -1) {
        res.status(200).send('the project has no project id');
        return;
    }


    let alreadyExistCompassList = await CompassActivity.findAll({
        attributes: ['grimoire_creation_date'],
        where: {
            repo_url: variables.label
        }
    });
    let compassActivityList = [];
    for (let activity of metrics) {
        if (!alreadyExistCompassList.includes(activity.grimoireCreationDate)) {
            activity.id = 0;
            activity.projectId = projectId;
            activity.repoUrl = activity.label;
            compassActivityList.push(activity);
        }
    }

    await bulkInsertCompassData(compassActivityList).catch(err => {
        throw err;
    });

    res.status(200).send('success');
}

/**
 *  Synchronize all compass metric to database
 */
export async function syncMetricActivity(req, res, next) {
    debug.log('compass data sync start');
    // get github project info
    const projectNumber = await GithubProjects.count();
    const Page = 100;
    let begin = 0;
    let index = 0;
    for (begin; begin < projectNumber; begin += Page) {
        let projectsList = await GithubProjects.findAll({
            attributes: ['id', 'htmlUrl'],
            offset: begin,
            limit: Page
        });

        let compassActivityMetricList = [];
        debug.log('Round in begin: ', begin, ' limit: ', Page);
        index += begin;
        for (const item of projectsList) {
            debug.log('==================== ', ++index, ' ===================');
            let project = item.dataValues;

            // let data = await request(
            //     compassUrl,
            //     query,
            //     {
            //         label: project.htmlUrl
            //     },
            // );

            let toBeSavedMetric = [];
            await fetchWithRetry(
                async function () {
                    return await request(
                        "https://oss-compass.org/api/graphql",
                        query,
                        {
                            label: project.htmlUrl
                        }
                    );
                }
                , 10000, 3).then(data => {
                    toBeSavedMetric = data.metricActivity.reverse();
                }
            ).catch(err => {
                debug.log(err);
            })

            if (toBeSavedMetric.length === 0) {
                // await sleep(3000);
                debug.log('project', index, ': ', project.htmlUrl, ' compass activity metric not exist');
                continue;
            }
            for (let activity of toBeSavedMetric) {
                compassActivityMetricList.push({
                    id: 0,
                    projectId: project.id,
                    repoUrl: activity.label,
                    activityScore: activity.activityScore,
                    closedIssuesCount: activity.closedIssuesCount,
                    codeReviewCount: activity.codeReviewCount,
                    issueCommentFrequency: activity.commentFrequency,
                    commitFrequency: activity.commitFrequency,
                    contributorCount: activity.contributorCount,
                    orgCount: activity.orgCount,
                    recentReleasesCount: activity.recentReleasesCount,
                    updatedIssuesCount: activity.updatedIssuesCount,
                    grimoireCreationDate: activity.grimoireCreationDate
                });
                if (compassActivityMetricList.length === 5) {
                    break;
                }
            }
        }

        // 批量集成
        await bulkInsertCompassData(compassActivityMetricList)
            .then(() => {
                debug.log('insert : ', projectsList.length, ' project\' compass data ')
            })
            .catch(err => {
                debug.log('bulk insert error');
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
    CompassActivity.bulkCreate(compassMetricList).then(compass => {
            debug.log('batch insert: ', compass);
        }
    ).catch(err => {
        debug.log('batch insert failure: ', err);
    })
}