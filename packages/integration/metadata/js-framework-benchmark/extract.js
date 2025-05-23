import { Benchmark, ProjectTechStack } from '@orginjs/oss-evaluation-data-model';
import { insertBenchmark, insertBenchmarkVersion } from '../../controllers/benchmark.js';
// import static data
import { eg as resultList } from './result.js';
import { v8 as frameworkList } from './framework.js';
import { cn as benchmarkList } from './benchmark.js';
import { generatePatchId } from '../../controllers/benchmark.js';

const BENCHMARK_MAP = {
  "create rows": "createRows",
  "replace all rows": "replaceAll",
  "partial update": "partialUpdate",
  "select row": "selectRow",
  "swap rows": "swapRows",
  "remove row": "removeRow",
  "create many rows": "createManyRows",
  "append rows to large table": "appendRows",
  "clear rows": "clearRows",
  "ready memory": "readyMemory",
  "run memory": "runMemory",
  "update every 10th row for 1k rows (5 cycles)": "update",
  "creating/clearing 1k rows (5 cycles)": "creating1k",
  "run memory 10k": "creating10k",
  "uncompressed size": "codeSize",
  "compressed size": "packageSize",
  "first paint": "internetTransfer"
}
const PROJECT_NAME_MAP = {
  "ember": "ember.js",
  "slim": "slim.js",
  "hydro": "hydro-js"
}
// 遍历每个framework，遍历每个benchmark，获取projectName, benchmark, displayName, rawValue
async function extractResult(rawPatchId) {
  let patchId;
  if (rawPatchId) {
    patchId = rawPatchId;
  } else {
    patchId = generatePatchId();
  }
  for (const result of resultList) {
    const framework = frameworkList[result.f];
    const {pId, projectName, techStack} = await matchProject(framework);
    if (pId == null || techStack !== '前端框架') {
      continue;
    }
    const versionRow = {
      pId,
      projectName,
      displayName: framework.name,
      techStack: '前端框架',
      platform: 'win32',
      content: null,
      envInfo: 'The benchmark was run on a MacBook Pro 14 (16 GB RAM, 6/10 Cores, OSX 14.9), Chrome 123.0.6312.59 (arm64)',
      patchId
    }
    const versionId = await insertBenchmarkVersion(versionRow);
    for (const benchmarkResult of result.b) {
      const benchmark = benchmarkList[benchmarkResult.b];
      const valueArray = benchmarkResult.v.total;
      let value;
      if (valueArray === undefined) {
        value = benchmarkResult.v.DEFAULT[0];
      } else {
        value = valueArray.reduce((a, b) => a + b, 0) / valueArray.length;
      }
      const row = {
        pId,
        projectName,
        displayName: framework.name,
        benchmark: BENCHMARK_MAP[benchmark.label],
        techStack: '前端框架',
        platform: 'win32',
        rawValue: value,
        content: null,
        envInfo: 'The benchmark was run on a MacBook Pro 14 (16 GB RAM, 6/10 Cores, OSX 14.9), Chrome 123.0.6312.59 (arm64)',
        patchId
      }
      
      await insertBenchmark(row, versionId);
    }
  }
}

async function matchProject(framework) {
  const frameworkVersionName = framework.name;
  const frameworkName = frameworkVersionName.substring(0, frameworkVersionName.indexOf('-'));
  const frameworkUrl = framework.frameworkHomeURL;
  // Try matching with homepage
  let project = await ProjectTechStack.findOne({
    where: {
      html_url: frameworkUrl
    }
  });
  // if no home page url matched, try matching with name
  if (project === null) {
    // use known project mapping first
    if (PROJECT_NAME_MAP[frameworkName]) {
      project = await ProjectTechStack.findOne({
        where: {
          name: PROJECT_NAME_MAP[frameworkName]
        }
      })
    } else {
      project = await ProjectTechStack.findOne({
        where: {
          name: frameworkName
        }
      })
    }
  }
  if (project === null) {
    return {pId: null, projectName: null};
  }
  return {
    pId: project.pId,
    projectName: project.name,
    techStack: project.subcategory
  }
}

extractResult('20240425104944241929');