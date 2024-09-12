import dayjs from 'dayjs';
import async from 'async';
import { Op } from 'sequelize';
import {
  Benchmark,
  EvaluationModel,
  EvaluationSummary,
  EvaluationSummaryHistory,
  Scorecard,
  CriticalityScore,
  OpenDigger,
  CompassActivity,
  GithubProjects,
  CncfDocumentScoreOnly,
  sequelize,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { ServerError } from '../util/error.js';
import { getProjectByUrl } from '../util/util.js';
import BenchmarkVersionScore from '@orginjs/oss-evaluation-data-model/models/BenchmarkVersionScore.js';
import { storeEvaluateTrendHistory } from './trendHistory.js';

const MetricType = Object.freeze({
  L0: 0, // L0: Function / Quality / Performance / Ecology / Innovation
  MAIN: 1, // L1: usability ...
  SUB: 2, // L2: satisfaction ...
  BENCH: 3,
  BENCH_SUB: 4,
});

const DataSource = Object.freeze([
  {
    model: Scorecard,
    scoreName: 'score',
    isDesc: true,
    saveTo: 'scorecardScore',
  },
  {
    model: CriticalityScore,
    scoreName: 'score',
    isDesc: true,
    saveTo: 'criticalityScore',
  },
  {
    model: OpenDigger,
    scoreName: 'openrank',
    isDesc: true,
    saveTo: 'openrank',
  },
  {
    model: OpenDigger,
    scoreName: 'busFactor',
    isDesc: true,
    saveTo: 'busFactor',
  },
  {
    model: CompassActivity,
    scoreName: 'contributorCount',
    isDesc: true,
    saveTo: 'contributorCount',
  },
  {
    model: CompassActivity,
    scoreName: 'orgCount',
    isDesc: true,
    saveTo: 'orgCount',
  },
  {
    model: CompassActivity,
    scoreName: 'commentFrequency',
    isDesc: true,
    saveTo: 'commentFrequency',
  },
  {
    model: CompassActivity,
    scoreName: 'codeReviewCount',
    isDesc: true,
    saveTo: 'codeReviewCount',
  },
  {
    model: CompassActivity,
    scoreName: 'updatedIssuesCount',
    isDesc: true,
    saveTo: 'updatedIssuesCount',
  },
  {
    model: CompassActivity,
    scoreName: 'closedIssuesCount',
    isDesc: true,
    saveTo: 'closedIssuesCount',
  },
  {
    model: CompassActivity,
    scoreName: 'recentReleasesCount',
    isDesc: true,
    saveTo: 'recentReleasesCount',
  },
  {
    model: GithubProjects,
    scoreName: 'pushedAt',
    isDesc: false,
    saveTo: 'pushedAt',
  },
  {
    model: GithubProjects,
    scoreName: 'stargazersCount',
    isDesc: true,
    saveTo: 'stargazersCount',
  },
  {
    model: CncfDocumentScoreOnly,
    scoreName: 'documentScore',
    isDesc: true,
    saveTo: 'documentScore',
  },
]);

export async function syncProjectEvaluationHandler(req, res) {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    await syncAllProjectEvaluation();
    res.status(200).json('ok');
  } else {
    const project = await getProjectByUrl(repoUrl);
    const summary = await syncSingleProjectEvaluation(project);
    res.status(200).json(summary);
  }
}

async function loadModel() {
  const metricList = await EvaluationModel.findAll({
    where: { type: { [Op.gte]: MetricType.L0 } },
  });
  const model = {};
  for (const metric of metricList) {
    const key = metric.dimension + metric.techStack;
    if (!model[key]) {
      model[key] = [metric.toJSON()];
    } else {
      model[key].push(metric.toJSON());
    }
  }
  return model;
}

async function updateAllEvaluationSummary() {
  // create all project summary
  await sequelize.query(`INSERT INTO oss_evaluation_summary(project_id,project_name)
  SELECT id as project_id, full_name as project_name FROM github_projects WHERE id NOT IN
  (SELECT project_id FROM oss_evaluation_summary)`);
  // update tech stack
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN project_tech_stack t2
  ON t1.project_id= t2.project_id SET t1.tech_stack= t2.subcategory
  WHERE t2.category IS NOT NULL`);

  // 1. function metrics
  // update state of js
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN
  (SELECT a.project_id, a.satisfaction_percentage, a.usage_percentage from state_of_js_detail a,
    (SELECT project_id,MAX(year) year FROM state_of_js_detail GROUP BY project_id) b
    WHERE a.project_id = b.project_id AND a.year = b.year) t2
  ON t1.project_id= t2.project_id SET t1.satisfaction= t2.satisfaction_percentage,
	t1.market_share = t2.usage_percentage`);
  // update cncf document
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN cncf_document_score t2
    ON t1.project_id= t2.project_id SET t1.doc_best_practice= t2.document_score
    WHERE t2.document_score IS NOT NULL`);

  // 2. quality metrics
  // update scorecard
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN scorecard_info t2
  ON t1.project_id= t2.project_id SET t1.scorecard_score= t2.score
  WHERE t2.score IS NOT NULL`);
  // update sonar cloud score
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN sonar_cloud_project t2
  ON t1.project_id= t2.github_project_id SET t1.sonarcloud_score =
  ASCII('F')*4-ASCII(maintainability_rating)-ASCII(reliability_rating)-ASCII(security_rating)-ASCII(security_review_rating)
  WHERE t2.analysis_date IS NOT NULL`);

  // 3. ecology metrics
  // update openrank and bus factor
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN opendigger_info t2
    ON t1.project_id= t2.project_id SET t1.openrank= t2.openrank, t1.bus_factor = t2.bus_factor
    WHERE t2.openrank IS NOT NULL`);
  // update criticality score
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN criticality_score t2
  ON t1.project_id= t2.project_id SET t1.criticality_score= t2.score
  WHERE t2.score IS NOT NULL`);
  // update compass
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN
  (SELECT a.* from compass_activity_detail a,
    (SELECT project_id,MAX(grimoire_creation_date) grimoire_creation_date FROM compass_activity_detail GROUP BY project_id) b
    WHERE a.project_id = b.project_id AND a.grimoire_creation_date = b.grimoire_creation_date) t2
  ON t1.project_id= t2.project_id
  SET t1.contributor_count= t2.contributor_count, t1.closed_issues_count= t2.closed_issues_count,
  t1.commit_frequency= t2.commit_frequency, t1.comment_frequency= t2.comment_frequency,
  t1.code_review_count= t2.code_review_count, t1.org_count= t2.org_count,
  t1.updated_issues_count= t2.updated_issues_count, t1.recent_releases_count= t2.recent_releases_count`);
  // update github star, fork, create/update time
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN github_projects t2
  ON t1.project_id= t2.id SET t1.stargazers_count= t2.stargazers_count,
  t1.forks_count = t2.forks_count, t1.code_size = t2.code_size,
  t1.create_time = TIMESTAMPDIFF(MONTH,STR_TO_DATE(t2.created_at,'%Y-%m-%dT%H:%i:%sZ'),NOW()),
	t1.update_time = TIMESTAMPDIFF(MONTH,STR_TO_DATE(t2.pushed_at,'%Y-%m-%dT%H:%i:%sZ'),NOW())`);
  // update npm downloads, use the average for last 3 months
  const last3month = dayjs().subtract(3, 'month').format('YYYY-MM-DD');
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN
  (SELECT project_id, AVG( downloads ) AS npm_downloads FROM package_download_count a
  WHERE end_date > '${last3month}' GROUP BY project_id) t2
  ON t1.project_id = t2.project_id SET t1.npm_downloads = t2.npm_downloads`);

  // 4. innovation metrics
  // update creator_orgs
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN
  (SELECT project_id, COUNT(1) AS orgs FROM ossinsight_creators_organizations a
  WHERE type =0 GROUP BY project_id) t2
  ON t1.project_id = t2.project_id SET t1.creator_orgs = t2.orgs`);
  // update creator_countries
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN
      (SELECT project_id, COUNT(1) AS countries FROM ossinsight_creators_countries a
      WHERE type =0 GROUP BY project_id) t2
      ON t1.project_id = t2.project_id SET t1.creator_countries = t2.countries`);
}

export async function syncAllProjectEvaluation() {
  await updateAllEvaluationSummary();
  const model = await loadModel();
  const projects = await EvaluationSummary.findAll();
  async.mapLimit(
    projects,
    10,
    async summary => {
      await doSingleProjectEvaluation(summary, model);
    },
    err => {
      if (err) throw err;
    },
  );
  // evaluate benchmark
  evaluateBenchmark(model, {});
}

/**
 * Stores the evaluation scores for all projects in the EvaluationSummaryHistory table.
 *
 * @param {dayjs} dayjsDate - The date to associate with the evaluation scores.
 *
 * This function retrieves the evaluation scores (functionScore, qualityScore, ecologyScore,
 * and innovationScore) for all projects from the EvaluationSummary table. It then
 * upserts these scores into the EvaluationSummaryHistory table, ensuring that if a record
 * for the same project and date already exists, it will be updated instead of creating a new one.
 * Finally, it calls the storeEvaluateTrendHistory function to store the evaluation scores
 * to trend history.
 */
async function storeAllEvaluationSummaryHistory(dayjsDate) {
  // store evaluation score for all projects
  const currentDate = dayjsDate.toDate();
  const projectList = await EvaluationSummary.findAll({
    attributes: ['projectId', 'functionScore', 'qualityScore', 'ecologyScore', 'innovationScore'],
  });
  for (const project of projectList) {
    await EvaluationSummaryHistory.upsert(
      {
        projectId: project.projectId,
        date: currentDate,
        qualityScore: project.qualityScore ? project.qualityScore : 0,
        functionScore: project.functionScore ? project.functionScore : 0,
        ecologyScore: project.ecologyScore ? project.ecologyScore : 0,
        innovationScore: project.innovationScore ? project.innovationScore : 0,
      },
      {
        where: {
          projectId: project.projectId,
          date: currentDate,
        },
      },
    );
  }
  // store evaluation score to trend history
  await storeEvaluateTrendHistory(null, dayjsDate);
}

export async function storeAllEvaluationHistoryHandler(req, res) {
  logger.info('start handler store');
  await storeAllEvaluationSummaryHistory(dayjs(req.params.date));
  res.status(200).json('ok');
}

export async function evaluateBenchmarkHandler(req, res) {
  const model = await loadModel();
  await evaluateBenchmark(model, req.body);
  res.status(200).send('Done!');
}

export async function evaluateBenchmark(model, options) {
  const { projectId, techStack } = options;
  const scoreMap = {};
  let allBenchmarkVersion;
  if (projectId) {
    allBenchmarkVersion = await BenchmarkVersionScore.findAll({ where: { projectId } });
  } else if (techStack) {
    // take all projects from specific techstack
    allBenchmarkVersion = await BenchmarkVersionScore.findAll({ where: { techStack } });
  } else {
    allBenchmarkVersion = await BenchmarkVersionScore.findAll();
  }
  for (const benchmarkVersion of allBenchmarkVersion) {
    const { id: bId } = benchmarkVersion;
    const performanceValue = await getDimensionScore(
      benchmarkVersion,
      'performance',
      benchmarkVersion.techStack,
      model,
      bId,
    );
    benchmarkVersion.score = Math.round(performanceValue * 100);
    maxOrCreate(scoreMap, benchmarkVersion.projectId, benchmarkVersion.score);
    await benchmarkVersion.save();
  }
  for (let benchmarkProjecId in scoreMap) {
    let projectScore = await EvaluationSummary.findOne({ where: { projectId: benchmarkProjecId } });
    projectScore.performanceScore = scoreMap[benchmarkProjecId];
    await projectScore.save();
  }
}

function maxOrCreate(map, key, value) {
  if (map[key] !== undefined) {
    map[key] = Math.max(map[key], value);
  } else {
    map[key] = value;
  }
}

export async function syncSingleProjectEvaluation(project) {
  if (!project) {
    throw new ServerError('Project not found!');
  }
  await updateAllEvaluationSummary();
  const projectId = project.id;
  const summary = await EvaluationSummary.findOne({ where: { projectId } });
  const model = await loadModel();
  // evaluate benchmark
  evaluateBenchmark(model, { projectId });
  return await doSingleProjectEvaluation(summary, model);
}

async function doSingleProjectEvaluation(summary, model) {
  logger.info(`doSingleProjectEvaluation: ${summary.projectId}`);
  /* eslint-disable no-param-reassign */
  // move to getStargazersTrend to improve performance
  // summary.starRate = await getGithubStarRate(summary.projectId);
  summary.functionValue = await getDimensionScore(summary, 'function', 'common', model);
  summary.qualityValue = await getDimensionScore(summary, 'quality', 'common', model);
  summary.ecologyValue = await getDimensionScore(summary, 'ecology', 'common', model);
  summary.innovationValue = await getDimensionScore(summary, 'innovation', 'common', model);

  let metric = model['function'][0];
  summary.functionScore =
    calLighthouseScore(summary.functionValue, metric.p10, metric.median) * 100;
  metric = model['quality'][0];
  summary.qualityScore = calLighthouseScore(summary.qualityValue, metric.p10, metric.median) * 100;
  metric = model['ecology'][0];
  summary.ecologyScore = calLighthouseScore(summary.ecologyValue, metric.p10, metric.median) * 100;
  metric = model['innovation'][0];
  summary.innovationScore =
    calLighthouseScore(summary.innovationValue, metric.p10, metric.median) * 100;
  // update score to database
  await summary.save();
  return summary;
}

async function getDimensionScore(project, dimension, techStack, model, bId) {
  const fieldList = model[dimension + techStack] || [];
  let totalScore = 0;
  let totalWeight = 0;
  for (const fieldItem of fieldList) {
    const { field, techStack: subTechStack, weight, threshold, defaultValue, type } = fieldItem;
    totalWeight += weight;
    if (type === MetricType.MAIN) {
      const fieldScore = await getDimensionScore(project, field, subTechStack, model, bId);
      logger.info(`------ ${field}  weight = ${weight} ------`);
      totalScore += weight * fieldScore;
    } else {
      let rawValue;
      if (techStack !== 'common') {
        // for performance score
        const { projectId } = project;
        rawValue = await getPerformanceRawValue(projectId, field, techStack, bId);
        if (rawValue == null || rawValue < 0) {
          continue;
        }
        const { isDesc, threshold } = fieldItem;
        totalScore += weight * calCriticalityScore(rawValue, threshold, isDesc);
      } else {
        rawValue = project[field] ?? defaultValue;
        if (!rawValue) {
          continue;
        }
        if (threshold > 100) {
          rawValue = calCriticalityScore(rawValue, threshold, true);
        } else {
          rawValue = rawValue / threshold;
        }
        totalScore += weight * rawValue;
      }
    }
  }
  logger.info(`dimension=${dimension} score=${totalScore / totalWeight}`);
  return totalWeight == 0 ? null : totalScore / totalWeight;
}

async function getPerformanceRawValue(projectId, field, techStack, bId) {
  const rawData = await Benchmark.findOne({
    where: { benchmark: field, projectId, techStack, bId },
  });
  if (rawData == null) {
    logger.info(`Project ${projectId} data not found`);
    return null;
  }
  return rawData.rawValue;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getGithubStarRate(projectId) {
  const sql = `SELECT date,stargazers,LAG(stargazers,3) OVER(ORDER BY date) AS lastQuote
  FROM github_projects_stargazers_trend WHERE project_id=${projectId} ORDER BY date DESC LIMIT 1`;
  const result = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
  let rate = 0;
  if (result && result.length > 0) {
    rate = result[0].stargazers - (result[0].lastQuote ? result[0].lastQuote : 0);
  }
  if (isNaN(rate)) {
    rate = 0;
  }
  return rate;
}

/**
 * 获取前百分之几的区分值, 默认按照从大到小降序进行排列
 * @param {*} values 数列
 * @param {*} proportion 百分比
 * @returns 前百分之几的区分值
 */
function getProportionValue(values, proportion) {
  if (values.length === 0) {
    throw new Error('Input array is empty');
  }

  if (proportion <= 0) {
    throw new Error('Proportion must not be lower than 0');
  }

  const percentage = proportion / 100;

  // Sorting values, preventing original array
  // from being mutated.
  const newValues = [...values].sort((a, b) => a - b).reverse();

  const targetIndex = (newValues.length - 1) * percentage;
  const index = Math.floor(targetIndex);

  if (index === 0) {
    return newValues[0];
  }

  const remaining = targetIndex % 1;
  return !remaining
    ? newValues[index]
    : newValues[index] + (newValues[index + 1] - newValues[index]) * remaining;
}

export async function setAllMedianAndP10(req, res) {
  for (const fieldItem of DataSource) {
    const { model, scoreName, saveTo } = fieldItem;
    const dataList = (
      await model.findAll({
        attributes: [scoreName],
      })
    ).map(item => item[scoreName]);
    const field = EvaluationModel.findOne({ where: { field: saveTo } });
    const { isDesc } = field;
    const { median, p10 } = generateMedianAndP10(dataList, isDesc);
    field.median = median;
    field.p10 = p10;
    await field.save();
  }
  res.status(200).send('Done!');
}

function generateMedianAndP10(values, isDesc) {
  const median = getProportionValue(values, 50);
  const p10 = getProportionValue(values, isDesc ? 10 : 90);
  return { median, p10 };
}
function calLighthouseScore(x, p10, m, isDesc = true) {
  if (p10 == null || m == null || x == null) {
    return null;
  }
  // special case: m and x are both 0
  if (m === 0) {
    m = 0.1;
  }
  if (x <= 0) {
    return 0;
  }
  const p = 0.3275911;
  const someConstant = 0.9061938024368232;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const miu = Math.log(m);
  const position = ((Math.log(x) - miu) / Math.abs(Math.log(p10) - miu)) * someConstant;
  const t = 1 / (1 + p * Math.abs(position));
  const signFlag = position >= 0 ? 1 : -1;
  const descFlag = isDesc ? 1 : -1;
  const err =
    signFlag *
    (1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-(position * position)));
  // isDesc为true的时候，数据越高，得分越高，用log-normal CDF，反之用complementary log-normal CDF
  const result = (1 + descFlag * err) / 2;
  return result;
}

function calCriticalityScore(x, threshold, isDesc) {
  if (threshold === 0) {
    return 0;
  }
  if (isDesc) {
    // Larger the data the better
    return Math.log(1.0 + x) / Math.log(1.0 + Math.max(x, threshold));
  } else {
    // Smaller the data the better
    return Math.log(1.0 + Math.min(x, threshold)) / Math.log(1.0 + x);
  }
}

export async function evaluateTimer() {
  const startCalculateTime = process.hrtime();
  logger.info('[Calculation][Evaluate] Calculation Job start');
  await syncAllProjectEvaluation();
  logger.info('[Calculation][Evaluate] Calculation Job end');
  const endCalculateTime = process.hrtime(startCalculateTime);
  logger.info(
    `[Calculation][Evaluate] The total time spent on calculation : ${endCalculateTime[0]}s ${endCalculateTime[1] / 1e6}ms`,
  );
  const startStoreTime = process.hrtime();
  logger.info('[Integration][EvaluateHistory] Integration Job start');
  await storeAllEvaluationSummaryHistory(dayjs());
  logger.info('[Integration][EvaluateHistory] Integration Job end');
  const endStoreTime = process.hrtime(startStoreTime);
  logger.info(
    `[Integration][EvaluateHistory] The total time spent on integration : ${endStoreTime[0]}s ${endStoreTime[1] / 1e6}ms`,
  );
}
