import dayjs from 'dayjs';
import debug from 'debug';
import Benchmark from '../models/Benchmark.js';

export function syncBenchmarkHandler(req, res) {
  const {
    projectName, benchmark, techStack, content, patchId, platform,
  } = req.body;
  Benchmark.upsert({
    projectName,
    benchmark,
    techStack,
    content,
    patchId,
    platform,
  });
  res.status(200).send('Done!');
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
  console.log(req);
  const {
    projectName, techStack, platform, list,
  } = req.body;
  let { patchId } = req.body;
  if (!patchId) {
    patchId = generatePatchId();
  }
  const benchmarkList = createBenchmarkList(projectName, techStack, platform, patchId, list);
  await Benchmark.bulkCreate(benchmarkList).then((compass) => {
    debug.log('insert into database: ', compass.length);
  }).catch((error) => {
    debug.log('Batch insert error: ', error.message);
  });
  res.status(200).send('Bulk create benchmark success!');
}

function createBenchmarkList(projectName, techStack, platform, patchId, list) {
  const benchmarkList = [];
  for (const data of list) {
    const { benchmark, content } = data;
    const item = {
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
