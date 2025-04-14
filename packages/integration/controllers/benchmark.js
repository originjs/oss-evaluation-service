import dayjs from 'dayjs';
import {
  Benchmark,
  BenchmarkIndex,
  GithubProjects,
  logger,
  ProjectTechStack,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import BenchmarkVersionScore from '@orginjs/oss-evaluation-data-model/models/BenchmarkVersionScore.js';
import { ServerError } from '../util/error.js';
import { QueryTypes } from 'sequelize';

export async function syncBenchmarkHandler(req, res) {
  try {
    await insertBenchmark(req.body);
    res.status(200).send('Done!');
  } catch (e) {
    res.status(500).send(e);
  }
}

export async function insertBenchmarkVersion(input) {
  const { projectName, techStack, displayName, envInfo } = input;
  let { projectId, patchId } = input;
  if (!projectId) {
    projectId = await getIdByName(projectName, techStack);
    if (!projectId) {
      throw new ServerError(`Project ${projectName} not found in list!`);
    }
  }
  if (!patchId) {
    patchId = generatePatchId();
  }
  const [response] = await BenchmarkVersionScore.upsert({
    projectId,
    version: displayName,
    score: null,
    techStack,
    isPublish: 0,
    description: patchId,
    envInfo: envInfo,
  });
  return response.null;
}

export async function insertBenchmark(input, versionId) {
  const { projectName, benchmark, techStack, rawValue, content, platform, displayName } = input;
  let { projectId, patchId } = input;
  if (!projectId) {
    projectId = await getIdByName(projectName, techStack);
    if (!projectId) {
      throw new ServerError(`Project ${projectName} not found in list!`);
    }
  }
  if (!patchId) {
    patchId = generatePatchId();
  }
  await Benchmark.upsert({
    projectId,
    projectName,
    displayName: displayName ?? '',
    benchmark,
    techStack,
    rawValue,
    content,
    patchId,
    platform,
    bId: versionId,
  });
}

export async function updateScore(req, res) {
  const { benchmark, patchId, isDesc } = req.body;
  const dataList = await Benchmark.findAll({ where: { benchmark, patch_id: patchId } });
  if (dataList.length === 0) {
    res.status(500).send('Non matched data found!');
    return;
  }
  const weightMap = getWeightMap();
  const newWeightMap = updateThreshold(dataList, weightMap, isDesc);
  for (const benchmarkItem of dataList) {
    const { projectId, content, patchId: itemPatchId, benchmark: itemBenchmark } = benchmarkItem;
    const score = await calScore(newWeightMap, content);
    await sequelize.query(
      `UPDATE benchmark SET score=${score} WHERE project_id = ${projectId} AND benchmark = '${itemBenchmark}' AND patch_id = '${itemPatchId}'`,
    );
  }
  res.status(200).send('Update Success!');
}

function getWeightMap() {
  return [
    {
      name: 'select_row',
      weight: 0.1,
      threshold: 0.3,
    },
    {
      name: 'swap_rows',
      weight: 0.9,
      threshold: 0.4,
    },
  ];
}

function updateThreshold(dataList, weightMap, isDesc) {
  const result = [];
  for (const weightItem of weightMap) {
    const { name } = weightItem;
    let threshold = null;
    for (const dataItem of dataList) {
      const { content } = dataItem;
      if (Object.prototype.hasOwnProperty.call(content, name)) {
        if (threshold === null) {
          threshold = content[name];
        } else if (isDesc) {
          threshold = Math.max(content[name], threshold);
        } else {
          threshold = Math.min(content[name], threshold);
        }
      }
    }
    if (threshold === null) {
      logger.info(`No data content match the benchmark of ${name}`);
      continue;
    } else {
      result.push({ ...weightItem, threshold });
    }
  }
  return result;
}

async function getIdByName(projectName, techStack) {
  const project = await ProjectTechStack.findOne({
    where: {
      // Cases occur where names replicate, add techStack validation
      name: projectName,
      subcategory: techStack,
    },
  });
  const { projectId } = project;
  return projectId;
}

async function calScore(weightMap, param) {
  let score = 0;
  for (const weightItem of weightMap) {
    const { name, weight, threshold } = weightItem;
    if (Object.prototype.hasOwnProperty.call(param, name)) {
      score += calScoreSection(param[name], weight, threshold);
    } else {
      logger.info(`Weight name ${name} not found in input data!`);
    }
  }
  return score;
}

function calScoreSection(value, weight, threshold) {
  return weight * (Math.log(1 + Math.min(value, threshold)) / Math.log(1 + value));
}

export function getPatchId(req, res) {
  res.status(200).send(generatePatchId());
}

export function generatePatchId() {
  const date = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.random().toString().slice(-6);
  return `${date}${random}`;
}

/**
 * bulk insert for benchmark
 * @param {*} req request
 * req type define as：
 * {
 *   projectName: string
 *   techStack: string
 *   platform: string
 *   list: [
 *     {
 *       benchmark: string,
 *       content: JSON
 *     },
 *   ]
 * }
 * @param {*} res result
 */
export async function bulkAddBenchmarkHandler(req, res) {
  const { projectName, techStack, platform, list } = req.body;
  let { patchId } = req.body;
  if (!patchId) {
    patchId = generatePatchId();
  }
  // generate stardard list for data insert
  const benchmarkList = await genBenchmarkList(projectName, techStack, platform, patchId, list);
  await Benchmark.bulkCreate(benchmarkList)
    .then(compass => {
      logger.info('insert into database: ', compass.length);
    })
    .catch(error => {
      logger.error('Batch insert error: ', error.message);
    });
  res.status(200).send('Bulk create benchmark success!');
}

async function genBenchmarkList(projectName, techStack, platform, patchId, list) {
  const benchmarkList = [];
  for (const data of list) {
    const dataProjectName = projectName || data.projectName;
    const { benchmark, content, rawValue, displayName } = data;
    const projectId = await getIdByName(dataProjectName);
    const item = {
      projectId,
      projectName: dataProjectName,
      techStack,
      platform,
      patchId,
      benchmark,
      rawValue,
      displayName: displayName ?? '',
      content,
    };
    benchmarkList.push(item);
  }
  return benchmarkList;
}

export async function importBenchmarkByExcelJSONHandler(req, res) {
  const { benchmark, index } = req.body;
  await Benchmark.bulkCreate(benchmark);
  await BenchmarkIndex.bulkCreate(index);
  res.status(200).send('success');
}

export async function importBenchmarkIndexByGetHandler(req, res) {
  const index = req.query;
  if (Object.getOwnPropertyNames(index).length > 0) {
    try {
      await BenchmarkIndex.upsert(index);
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
  res.status(200).json(await randomGithubProject());
}

export async function importBenchmarkVersionScoreByGetHandler(req, res) {
  let { benchmark, apply } = req.query;
  benchmark = JSON.parse(benchmark);
  apply = JSON.parse(apply);

  const benchmarkVersion = await BenchmarkVersionScore.create({
    projectId: benchmark.projectId,
    version: benchmark.displayName || 'none',
    score: null,
    techStack: apply.benchmarkName,
    isPublish: 0,
    description: benchmark.patchId,
    envInfo: apply.envInfo,
  });

  res.status(200).json(await randomGithubProject(benchmarkVersion.id));
}

export async function importBenchmarkValueByGetHandler(req, res) {
  const benchmark = req.query;
  if (Object.getOwnPropertyNames(benchmark).length > 0) {
    await Benchmark.create(benchmark);
  }
  res.status(200).json(await randomGithubProject());
}
async function randomGithubProject(data) {
  const githubProjects = await sequelize.query(
    'SELECT * FROM github_projects ORDER BY RAND() LIMIT 1',
    {
      type: QueryTypes.SELECT,
      model: GithubProjects,
    },
  );
  githubProjects[0].description = data;
  return githubProjects;
}
