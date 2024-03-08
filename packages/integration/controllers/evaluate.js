import async from 'async';
import { Op } from 'sequelize';
import sequelize from '../util/database.js';
import Benchmark from '../models/Benchmark.js';
import EvaluationModel from '../models/EvaluationModel.js';
import EvaluationSummary from '../models/EvaluationSummary.js';
import { ServerError } from '../util/error.js';

const MetricType = Object.freeze({
  MAIN: 1,
  SUB: 2,
  BENCH: 3,
  BENCH_SUB: 4,
});

export async function evaluateProjectHandler(req, res) {
  const projectName = `${req.params.org}/${req.params.name}`;
  let project = await EvaluationSummary.findOne({ where: { projectName } });
  const model = await loadModel();
  project = await evaluateScore(project, model);
  res.status(200).json(project);
}

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
  // update openrank
  await sequelize.query(`UPDATE oss_evaluation_summary t1 INNER JOIN opendigger_info t2
  ON t1.project_id= t2.project_id SET t1.openrank= t2.openrank
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

  const model = await loadModel();
  await evaluateAllProjectScore(model);
  res.status(200).json('ok');
}

async function loadModel() {
  const metricList = await EvaluationModel.findAll({
    where: { type: { [Op.lte]: MetricType.BENCH } },
  });
  const model = {};
  for (const metric of metricList) {
    if (!model[metric.dimension]) {
      model[metric.dimension] = [metric];
    } else {
      model[metric.dimension].push(metric);
    }
  }
  return model;
}

async function evaluateAllProjectScore(model) {
  const projects = await EvaluationSummary.findAll();
  async.mapLimit(
    projects,
    10,
    async (project) => {
      await evaluateScore(project, model);
    },
    (err) => {
      if (err) throw err;
    },
  );
}

async function evaluateScore(project, model) {
  if (!project) {
    throw new ServerError('Project not found!');
  }
  /* eslint-disable no-param-reassign */
  project.functionValue = getDimensionScore(project, model.function, model);
  project.qualityValue = getDimensionScore(project, model.quality, model);
  project.ecologyValue = getDimensionScore(project, model.ecology, model);
  project.innovationValue = getDimensionScore(project, model.innovation, model);
  project.performanceValue = await getPerformanceScore(project, model);
  // update score to database
  await project.save();
  return project;
}

async function getPerformanceScore(project, model) {
  const metrics = model[project.techStack];
  if (!metrics) {
    return getDimensionScore(project, model.performance, model);
  }
  let totalWeight = 0;
  let totalScore = 0;
  for (const metric of metrics) {
    totalWeight += metric.weight;
    const benchmark = await Benchmark.findOne({
      attributes: ['score'],
      where: {
        projectId: project.projectId,
        benchmark: metric.field,
      },
    });
    totalScore += getParamScore(benchmark?.score, metric.weight, metric.threshold);
  }
  const score = totalScore / totalWeight;
  return Number.isNaN(score) ? null : score;
}

function getDimensionScore(project, metrics, model) {
  if (!project || !metrics) {
    return null;
  }
  let totalWeight = 0;
  let totalScore = 0;
  for (const metric of metrics) {
    totalWeight += metric.weight;
    let paramData;
    if (metric.type === MetricType.MAIN) {
      const subMetrics = model[metric.field];
      paramData = getDimensionScore(project, subMetrics, model);
    } else {
      paramData = project[metric.field];
    }
    if (paramData === null || paramData === undefined) {
      if (metric.weight >= 0) {
        paramData = 0;
      } else {
        paramData = metric.threshold;
      }
    }
    totalScore += paramData * metric.weight;
  }
  const score = totalScore / totalWeight;
  return Number.isNaN(score) ? null : score;
}

function getParamScore(param, weight, threshold) {
  return (Math.log(1 + param) / Math.log(1 + Math.max(param, threshold))) * weight;
}
