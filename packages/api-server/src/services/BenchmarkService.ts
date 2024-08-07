import {
  GithubProjects,
  NewProjectApply,
  BenchmarkIndex as BenchmarkIndexPo,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
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
import { ProxyAgent } from 'undici';

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });
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
export async function getIndexByTechStack(techStack: string): Promise<Array<BenchmarkIndex>> {
  return await BenchmarkIndexPo.findAll({
    where: {
      techStack,
    },
    order: [['order']],
  });
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
          bvst.score,
          github_projects.full_name as fullName
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
    join github_projects
                  on bt.project_id = github_projects.id
     WHERE bt.raw_value IS NOT NULL
  ORDER BY bt.project_id, bt.benchmark,bt.created_at;`;

  const benchmark = await sequelize.query(sql, {
    replacements: { techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  // format val
  for (const index of benchmark) {
    if (isNumber(index?.rawValue)) {
      // rounding
      index.rawValue = fixedRound(index.rawValue, 3);
    }
  }

  return benchmark;
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
  envInfo: string;
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
  await setOthersParam4Benchmark(data.benchmark, apply);
  // call integration url to import benchmark data
  await importBenchmarkData(data);
  const projectIds = data.benchmark.map(benchmark => benchmark.projectId);
  // set integration finished time if not err
  await NewProjectApply.update(
    {
      // dont set finishedTime, bacause need time to sync data from outer into inner
      // integrationFinishedTime: new Date(),
      // set imported projectId for this apply
      alternativeProjectId: [...new Set(projectIds)].join(','),
    },
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
  const requestOpts = {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
    },
  };
  const proxyUrl = process.env.PROXY_URL;
  if (proxyUrl) {
    const client = new ProxyAgent(proxyUrl);
    // @ts-expect-error no need handle
    requestOpts.dispatcher = client;
  }
  const requestFn = async (urlParam: string, arr: unknown[]) => {
    for (const obj of arr) {
      const url = new URL(urlParam);
      Object.getOwnPropertyNames(obj).forEach(key => {
        url.searchParams.append(key, obj[key]);
      });
      const importResponse = await fetch(url.href, requestOpts);
      if (!importResponse.ok) {
        throw new Error(
          `call api to import benchmark data failed ${url.href}! , ${await importResponse.text()}`,
        );
      }
      await sleep(1000);
    }
  };
  if (data.index?.length > 0) {
    await requestFn(`${process.env.INTEGRATION_URL}/sync/benchmark/getBenchmarkIndex`, data.index);
  }
  if (data.benchmark?.length > 0) {
    await requestFn(
      `${process.env.INTEGRATION_URL}/sync/benchmark/getBenchmarkValue`,
      data.benchmark,
    );
  }
}

/**
 * set projectId and patchId for benchmark
 * @param data benchmarkData
 */
async function setOthersParam4Benchmark(data: BenchmarkValue[], apply: any) {
  if (!data?.length) {
    throw new Error(`[benchmark import] no data for set project id`);
  }
  const softwareName2Id = new Map<string, number>();
  const patchId = moment(new Date()).format('YYYYMMDDHHmmssSSS');
  for (const benchmark of data) {
    const fullName = benchmark.projectName;
    benchmark.platform = apply.envInfo;
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

export async function exportBenchmrkByTechStackHandler(techStack: string) {
  const indices = await getIndexByTechStack(techStack);
  const benchmarkResult = await getBenchmarkResultByTechStack(techStack);
  if (indices?.length === 0 || benchmarkResult?.length === 0) {
    throw new Error('benchmark data is empty');
  }
  const workbook = new exceljs.Workbook();
  // write header
  const fullNames = new Set(benchmarkResult.map(item => item.fullName));
  const sheet = workbook.addWorksheet(`<${techStack}>`);
  const headerArr = ['指标分类', '指标名称', '指标单位', ...fullNames];
  const headerRow = sheet.addRow(headerArr);
  const headerLenght = headerArr.length;

  // set header style
  for (let i = 0; i < headerLenght; i++) {
    const cellIndex = i + 1;
    const cell = headerRow.getCell(cellIndex);
    if (cellIndex <= 3) {
      cell.font = { name: '黑体', size: 14 };
    } else {
      cell.font = { name: '黑体', size: 11 };
    }
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      // red bgColor
      fgColor: { argb: 'EF949F' },
    };
  }

  // Map<indexName,Map<fullName,rawValue>>
  const benchmarkMap = new Map<string, Map<string, number>>();
  for (const benchmark of benchmarkResult) {
    const indexName = benchmark.benchmark;
    if (!benchmarkMap.has(indexName)) {
      benchmarkMap.set(indexName, new Map<string, number>());
    }
    const dataMap = benchmarkMap.get(indexName);
    dataMap.set(benchmark.fullName, benchmark.rawValue);
  }

  // write excel content
  const afterSortIndex = indices.sort((a, b) => a.order - b.order);
  for (const index of afterSortIndex) {
    const excelRow = [index.category, index.displayName, index.unit] as (string | number)[];
    for (const fullName of fullNames) {
      const val = benchmarkMap.get(index.indexName)?.get(fullName);
      excelRow.push(val ? parseFloat(fixedRound(val, 2)) : null);
    }
    const row = sheet.addRow(excelRow);
    // set content stype
    row.font = { name: '黑体', size: 11 };
  }

  // auto adjust column width
  for (let i = 0; i < headerLenght; i++) {
    const columnIndex = i + 1;
    const column = sheet.getColumn(columnIndex);
    const defaultWidth = 20;
    let maxLength = defaultWidth;
    column.eachCell({ includeEmpty: false }, (cell, rowNum) => {
      const cellWidth = cell.value ? cell.value.toString().length : defaultWidth;
      maxLength = Math.max(maxLength, cellWidth);
      // for content style
      if (i >= 3 && rowNum > 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          // red bgColor
          fgColor: { argb: 'ADD88D' },
        };
      }
    });
    column.width = maxLength;
  }

  return workbook.xlsx.writeBuffer();
}
