import dayjs from 'dayjs';
import debug from 'debug';
import { Benchmark, ProjectTechStack } from '@orginjs/oss-evaluation-data-model';
import sequelize from '../util/database.js';

export async function syncBenchmarkHandler(req, res) {
  const { projectName, benchmark, techStack, rawValue, content, platform } = req.body;
  const projectId = await getIdByName(projectName, techStack);
  let { patchId } = req.body;
  if (!patchId) {
    patchId = generatePatchId();
  }
  if (projectId) {
    await Benchmark.upsert({
      projectId,
      projectName,
      benchmark,
      techStack,
      rawValue,
      content,
      patchId,
      platform,
    });
    res.status(200).send('Done!');
  } else {
    res.status(500).send(`Project ${projectName} not found in list!`);
  }
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
      console.warn(`No data content match the benchmark of ${name}`);
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
      console.warn(`Weight name ${name} not found in input data!`);
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

function generatePatchId() {
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
      debug.log('insert into database: ', compass.length);
    })
    .catch(error => {
      debug.log('Batch insert error: ', error.message);
    });
  res.status(200).send('Bulk create benchmark success!');
}

async function genBenchmarkList(projectName, techStack, platform, patchId, list) {
  const benchmarkList = [];
  for (const data of list) {
    const dataProjectName = projectName || data.projectName;
    const { benchmark, content } = data;
    const projectId = await getIdByName(dataProjectName);
    const item = {
      projectId,
      projectName: dataProjectName,
      techStack,
      platform,
      patchId,
      benchmark,
      content,
    };
    benchmarkList.push(item);
  }
  return benchmarkList;
}
