import dayjs from 'dayjs';
import debug from 'debug';
import Benchmark from '../models/Benchmark.js';
import ProjectTechStack from '../models/ProjectTechStack.js';

export async function syncBenchmarkHandler(req, res) {
  const {
    projectName, benchmark, techStack, content, patchId, platform,
  } = req.body;
  const projectId = await getIdByName(projectName);
  const weightMap = [
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
  const score = await calScore(weightMap, JSON.parse(content));
  if (projectId) {
    Benchmark.upsert({
      projectId,
      projectName,
      benchmark,
      techStack,
      score,
      content,
      patchId,
      platform,
    });
    res.status(200).send('Done!');
  } else {
    res.status(500).send(`Project ${projectName} not found in list!`);
  }
}

async function getIdByName(projectName) {
  const project = await ProjectTechStack.findOne({ where: { name: projectName } });
  const { projectId } = project;
  return projectId;
}

async function calScore(weightMap, param) {
  let score = 0;
  for (const weightItem of weightMap) {
    const { name, weight, threshold } = weightItem;
    score += calScoreSection(param[name], weight, threshold);
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
  const {
    projectName, techStack, platform, list,
  } = req.body;
  let { patchId } = req.body;
  if (!patchId) {
    patchId = generatePatchId();
  }
  // generate stardard list for data insert
  const benchmarkList = await createBenchmarkList(projectName, techStack, platform, patchId, list);
  await Benchmark.bulkCreate(benchmarkList).then((compass) => {
    debug.log('insert into database: ', compass.length);
  }).catch((error) => {
    debug.log('Batch insert error: ', error.message);
  });
  res.status(200).send('Bulk create benchmark success!');
}

async function createBenchmarkList(projectName, techStack, platform, patchId, list) {
  const benchmarkList = [];
  for (const data of list) {
    const { benchmark, content } = data;
    const projectId = await getIdByName(projectName);
    const item = {
      projectId,
      projectName,
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
