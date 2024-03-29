import debug from 'debug';
import async from 'async';
import { Op } from 'sequelize';
import {
  Benchmark,
  EvaluationModel,
  EvaluationSummary,
  Scorecard,
  CriticalityScore,
  OpenDigger,
  CompassActivity,
  GithubProjects,
  CncfDocumentScoreOnly,
} from '@orginjs/oss-evaluation-data-model';
import sequelize from '../util/database.js';
import { ServerError } from '../util/error.js';

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

export async function calculateAllMetricsHandler(req, res) {
  // create all project summary
  await sequelize.query(`INSERT INTO oss_evaluation_summary(project_id,project_name) 
  SELECT id as project_id, full_name as project_name FROM github_projects WHERE id NOT IN
  (SELECT project_id FROM oss_evaluation_summary)`);
  // update tech stack
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN project_tech_stack t2
  ON t1.project_id= t2.project_id SET t1.tech_stack= t2.subcategory
  WHERE t2.category IS NOT NULL`);
  // update state of js
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN
  (SELECT a.project_id, a.satisfaction_percentage from state_of_js_detail a,
    (SELECT project_id,MAX(year) year FROM state_of_js_detail GROUP BY project_id) b 
    WHERE a.project_id = b.project_id AND a.year = b.year) t2
  ON t1.project_id= t2.project_id SET t1.satisfaction= t2.satisfaction_percentage`);
  // update scorecard
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN scorecard_info t2
  ON t1.project_id= t2.project_id SET t1.scorecard_score= t2.score
  WHERE t2.score IS NOT NULL`);
  // update criticality score
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN criticality_score t2
  ON t1.project_id= t2.project_id SET t1.criticality_score= t2.score
  WHERE t2.score IS NOT NULL`);
  // update openrank and bus factor
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN opendigger_info t2
  ON t1.project_id= t2.project_id SET t1.openrank= t2.openrank, t1.bus_factor = t2.bus_factor
  WHERE t2.openrank IS NOT NULL`);
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

  // update cncf document
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN cncf_document_score_only t2
  ON t1.project_id= t2.project_id SET t1.doc_best_practice= t2.document_score
  WHERE t2.document_score IS NOT NULL`);

  // update star, fork
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN github_projects t2
  ON t1.project_id= t2.id SET t1.stargazers_count= t2.stargazers_count, t1.forks_count = t2.forks_count`);

  const model = await loadModel();
  await evaluateAllProjectScore(model);
  res.status(200).json('ok');
}

async function loadModel() {
  const metricList = await EvaluationModel.findAll({
    where: { type: { [Op.gt]: MetricType.L0 } },
  });
  const model = {};
  for (const metric of metricList) {
    const key = metric.dimension + metric.techStack;
    if (!model[key]) {
      model[key] = [metric];
    } else {
      model[key].push(metric);
    }
  }
  return model;
}

async function evaluateAllProjectScore(model) {
  const projects = await EvaluationSummary.findAll();
  async.mapLimit(
    projects,
    10,
    async project => {
      await evaluateScore(project, model);
    },
    err => {
      if (err) throw err;
    },
  );
}

export async function evaluateProjectHandler(req, res) {
  const { repoName: projectName } = req.params;
  let project = await EvaluationSummary.findOne({ where: { projectName } });
  const model = await loadModel();
  project = await evaluateScore(project, model);
  res.status(200).json(project);
}

async function evaluateScore(project, model) {
  if (!project) {
    throw new ServerError('Project not found!');
  }

  /* eslint-disable no-param-reassign */
  project.functionValue = await getDimensionScore(project, 'function', 'common', model);
  project.qualityValue = await getDimensionScore(project, 'quality', 'common', model);
  project.ecologyValue = await getDimensionScore(project, 'ecology', 'common', model);
  project.innovationValue = await getDimensionScore(project, 'innovation', 'common', model);
  project.performanceValue = await getDimensionScore(
    project,
    'performance',
    project.techStack,
    model,
  );

  let metric = await EvaluationModel.findOne({
    where: { type: MetricType.L0, dimension: 'function' },
  });
  project.functionScore =
    calLighthouseScore(project.functionValue, metric.p10, metric.median) * 100;
  metric = await EvaluationModel.findOne({
    where: { type: MetricType.L0, dimension: 'quality' },
  });
  project.qualityScore = calLighthouseScore(project.qualityValue, metric.p10, metric.median) * 100;
  metric = await EvaluationModel.findOne({
    where: { type: MetricType.L0, dimension: 'ecology' },
  });
  project.ecologyScore = calLighthouseScore(project.ecologyValue, metric.p10, metric.median) * 100;
  // update score to database
  await project.save();
  return project;
}

async function getDimensionScore(project, dimension, techStack, model) {
  const fieldList = model[dimension + techStack] || [];
  let totalScore = 0;
  for (const fieldItem of fieldList) {
    const { field, techStack: subTechStack, weight, median, p10, isDesc, type } = fieldItem;
    if (type === MetricType.MAIN) {
      const fieldScore = await getDimensionScore(project, field, subTechStack, model);
      totalScore += weight * fieldScore;
    } else {
      // score 0 if no data provided
      if (p10 === null || median === null) {
        continue;
      }
      let rawValue;
      if (techStack !== 'common') {
        const { projectId } = project;
        rawValue = await getPerformanceRawValue(projectId, field, techStack);
        if (rawValue == null) {
          continue;
        }
      } else {
        if (project[field] == null) {
          continue;
        }
        rawValue = project[field];
      }
      totalScore += weight * calLighthouseScore(rawValue, p10, median, isDesc);
    }
  }
  return totalScore;
}

async function getPerformanceRawValue(projectId, field, techStack) {
  const rawData = await Benchmark.findOne({ where: { benchmark: field, projectId, techStack } });
  if (rawData == null) {
    debug.log(`Project ${projectId} data not found`);
    return null;
  }
  return rawData.rawValue;
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
  // special case: m and x are both 0
  if (m === 0) {
    m = 0.1;
  }
  if (x === m && x === 0) {
    return 0.5;
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
