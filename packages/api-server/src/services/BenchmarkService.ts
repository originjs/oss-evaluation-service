import { GithubProjects, NewProjectApply, sequelize } from '@orginjs/oss-evaluation-data-model';
import { randomUUID } from 'crypto';
import exceljs from 'exceljs';
import moment from 'moment';
import { isNumber } from 'underscore';
import type {
  BenchmarkIndex,
  BenchmarkResult,
  SoftwareBaseInfo,
} from '../interfaces/SoftwareInfo.js';
import { fixedRound } from '../utils/math.js';
import { Op } from 'sequelize';

/**
 * query projects by tech stack
 *
 * @param category category
 * @param techStack Tech stack
 * @returns projects
 */
export async function queryProjectsByTechStack(
  category: string,
  techStack: string,
): Promise<Array<SoftwareBaseInfo>> {
  const sql = `
    SELECT gp.id as projectId,
           gp.NAME AS projectName,
           gp.full_name as repoName,
           gp.html_url as url,
           gp.description,
           gp.owner_avatar_url as logo,
           gp.stargazers_count as star,
           gp.forks_count as forksCount,
           (SELECT GROUP_CONCAT( distinct VERSION ORDER BY VERSION desc SEPARATOR '##')
              FROM benchmark_version_score bvs
             WHERE bvs.project_id = gp.id) version,
           (SELECT version
              FROM benchmark_version_score bvs
             WHERE bvs.project_id = gp.id ORDER BY score DESC LIMIT 1) selectedVersion
      FROM github_projects gp
INNER JOIN project_tech_stack pts
        ON gp.id = pts.project_id
     WHERE pts.category = :category
       AND pts.subcategory = :techStack
  ORDER BY gp.stargazers_count DESC;
  `;

  const projects = await sequelize.query(sql, {
    replacements: { category, techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  projects.forEach(element => {
    element['versionList'] = element.version ? element.version.split('##') : [];
    element['selectedVersions'] = [];
    element.selectedVersion && element['selectedVersions'].push(element.selectedVersion);
  });

  return projects;
}

/**
 * query benchmark indexs by tech stack
 *
 * @param techStack Tech stack
 * @returns indexs
 */
export async function queryIndexByTechStack(techStack: string): Promise<Array<BenchmarkIndex>> {
  const sql = `
  SELECT t.index_name   as indexName,
    t.display_name as displayName,
    t.unit,
    t.category,
    t.description
  FROM benchmark_index t
  WHERE t.tech_stack = :techStack
  ORDER BY t.order;
  `;

  const indexs = await sequelize.query(sql, {
    replacements: { techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  return indexs;
}

/**
 * query benchmark result by tech stack
 *
 * @param techStack Tech stack
 * @returns benchmark result
 */
export async function getBenchmarkResultByTechStack(
  techStack: string,
): Promise<Array<BenchmarkResult>> {
  const sql = `
    SELECT bt.project_id AS projectId,
          bt.project_name AS projectName,
          bt.display_name AS displayName,
          bt.benchmark,
          bt.raw_value AS rawValue,
          bt.created_at AS createdAt,
          bt.content,
          bt.platform,
          bvst.version,
          bvst.env_info AS envInfo,
          bvst.score
      FROM benchmark bt
INNER JOIN (
    SELECT st.project_id,
           st.VERSION,
           MAX(st.id) b_id,
           MAX(st.env_info) env_info,
           MAX(st.score) score
      FROM benchmark_version_score st
     WHERE st.tech_stack = :techStack
  GROUP BY st.project_id, st.VERSION) bvst
        ON bvst.b_id = bt.b_id
     WHERE bt.raw_value IS NOT NULL
  ORDER BY bt.project_id, bt.benchmark,bt.created_at;`;

  const indexes = await sequelize.query(sql, {
    replacements: { techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  // format val
  for (const index of indexes) {
    if (isNumber(index?.rawValue)) {
      // rounding
      index.rawValue = fixedRound(index.rawValue, 3);
    }
  }

  return indexes;
}

interface BenchmarkValue {
  projectName: string;
  displayName: string;
  index: BenchmarkIndex;
  benchmark: string;
  rawValue: number;
  platform: string;
  projectId: number;
  patchId: string;
}

export async function importBenchmarkFromExcel(file: Express.Multer.File) {
  if (!file) {
    throw new Error(`file is empty`);
  }
  const allowedMimeTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  // not excel file
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Please upload an Excel type file`);
  }
  const filename = `${Buffer.from(file.originalname, 'latin1').toString('utf8')}`;
  const apply = await NewProjectApply.findOne({
    where: {
      filename,
      integrationFinishedTime: {
        [Op.is]: null,
      },
    },
  });
  // err if no benchmark apply with filename
  if (!apply) {
    throw new Error(`no benchmark apply with filename:{${filename}} or this file is imported`);
  }
  const data = await parseBenchmarkExcel2JSON(file.buffer);
  await setOthersParam4Benchmark(data.benchmark);
  // call integration url to import benchmark data
  await importBenchmarkData(data);
  // set integration finished time if not err
  await NewProjectApply.update(
    { integrationFinishedTime: new Date() },
    {
      where: {
        filename,
      },
    },
  );
  return data;
}

async function parseBenchmarkExcel2JSON(buffer: Buffer) {
  const workbook = new exceljs.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.getWorksheet(1);
  const rowCount = sheet.actualRowCount;
  const columnCount = sheet.actualColumnCount;
  if (rowCount <= 2 || columnCount <= 3) {
    throw new Error(`row or column is invalid`);
  }
  const header = sheet.getRow(1);
  const rows = sheet.getRows(2, rowCount - 1);
  const softwareReg = /.+(?=[(（].+[)）])/;
  const benchmarkData: BenchmarkValue[] = [];
  const indexData: BenchmarkIndex[] = [];
  let i = 1;
  for (const row of rows) {
    const softwareName2Data = new Map<string, BenchmarkValue>();
    const index = {} as BenchmarkIndex;
    row.eachCell(async (cell, num) => {
      const cellVal = cell.value?.toString()?.trim();
      // skip notes
      if (cellVal.startsWith('注意事项')) {
        return;
      }
      if (!cellVal) {
        return;
      }
      switch (num) {
        case 1:
          index.category = cellVal;
          index.order = i++;
          break;
        case 2:
          index.displayName = cellVal;
          index.indexName = randomUUID();
          break;
        case 3:
          index.unit = cellVal;
          break;
        default: {
          // get softwareName
          const softwareNameAndVersion = header.getCell(cell.col).value.toString();
          const fullSoftwareName = softwareNameAndVersion.match(softwareReg)?.[0];
          if (!softwareName2Data.has(softwareNameAndVersion)) {
            softwareName2Data.set(softwareNameAndVersion, {
              benchmark: index.indexName,
              projectName: fullSoftwareName,
              displayName: softwareNameAndVersion.includes('/')
                ? softwareNameAndVersion.split('/')[1]
                : softwareNameAndVersion,
              rawValue: Number(cellVal),
            } as BenchmarkValue);
          }
        }
      }
    });
    if (Object.getOwnPropertyNames(index).length !== 0) {
      indexData.push(index);
    }
    benchmarkData.push(...softwareName2Data.values());
  }
  // sort benchmark by softwareName
  benchmarkData.sort((a, b) => {
    return a.displayName.localeCompare(b.displayName);
  });
  return { benchmark: benchmarkData, index: indexData };
}

/**
 * call integration api to import benchmark
 * @param data benchmarData
 */
async function importBenchmarkData(data: { benchmark: BenchmarkValue[]; index: BenchmarkIndex[] }) {
  if (!process.env.INTEGRATION_URL) {
    throw new Error('no env named {INTEGRATION_URL} , skip import');
  }
  const url = `${process.env.INTEGRATION_URL}/sync/benchmark/importBenchmarkByExcelJSON`;
  const importResponse = await fetch(url, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!importResponse.ok) {
    throw new Error(`call api to import benchmark data failed! , ${await importResponse.text()}`);
  }
}

/**
 * set projectId and patchId for benchmark
 * @param data benchmarkData
 */
async function setOthersParam4Benchmark(data: BenchmarkValue[]) {
  if (!data?.length) {
    throw new Error(`[benchmark import] no data for set project id`);
  }
  const softwareName2Id = new Map<string, number>();
  const patchId = moment(new Date()).format('YYYYMMDDHHmmssSSS');
  for (const benchmark of data) {
    const fullName = benchmark.projectName;
    if (!softwareName2Id.has(fullName)) {
      const project = await GithubProjects.findOne({
        where: {
          fullName: fullName,
        },
        attributes: ['id'],
      });
      if (!project) {
        throw new Error(`cant find project named:${fullName}`);
      }
      softwareName2Id.set(fullName, project.id);
    }
    benchmark.projectId = softwareName2Id.get(fullName);
    benchmark.patchId = patchId;
  }
}
