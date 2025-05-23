import {
  ViewProjects,
  NewProjectApply,
  BenchmarkIndex as BenchmarkIndexPo,
  sequelize,
  logger,
  BenchmarkTechStacks,
} from '@orginjs/oss-evaluation-data-model';
import { randomUUID } from 'crypto';
import exceljs from 'exceljs';
import type { CellValue } from 'exceljs';
import moment from 'moment';
import { isNumber } from 'underscore';
import type {
  BenchmarkIndex,
  BenchmarkResult,
  SoftwareBaseInfo,
  BenchmarkTechStack,
} from '../interfaces/SoftwareInfo.js';
import { fixedRound } from '../utils/math.js';
import { Op } from 'sequelize';
import { readFileSync } from 'fs';
import { requestFn } from '../utils/integrationRequestFn.js';

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
      SELECT p.p_id             as     pId,
             p.NAME             AS     projectName,
             p.full_name        as     repoName,
             p.html_url         as     url,
             p.description,
             p.owner_avatar_url as     logo,
             p.stargazers_count as     star,
             p.forks_count      as     forksCount,
             (SELECT GROUP_CONCAT(distinct VERSION ORDER BY VERSION desc SEPARATOR '##')
              FROM benchmark_version_score bvs
              WHERE bvs.p_id = p.p_id) version,
             (SELECT version
              FROM benchmark_version_score bvs
              WHERE bvs.p_id = p.p_id
              ORDER BY score DESC
              LIMIT 1)                 selectedVersion
      FROM view_projects p
               INNER JOIN project_tech_stack pts
                          ON p.p_id = pts.p_id
      WHERE pts.category = :category
        AND pts.subcategory = :techStack
      ORDER BY p.stargazers_count DESC;
  `;

  const projects = await sequelize.query(sql, {
    replacements: { category, techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  projects.forEach(element => {
    element['versionList'] = element.version ? element.version.split('##') : [];
    element['selectedVersions'] = element['versionList'];
    // element.selectedVersion && element['selectedVersions'].push(element.selectedVersion);
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
      SELECT bt.p_id         AS pId,
             bt.project_name AS projectName,
             bt.display_name AS displayName,
             bt.benchmark,
             bt.raw_value    AS rawValue,
             bt.created_at   AS createdAt,
             bt.content,
             bt.platform,
             bvst.version,
             bvst.env_info   AS envInfo,
             bvst.score,
             p.full_name     as fullName
      FROM benchmark bt
               INNER JOIN (SELECT st.p_id,
                                  st.VERSION,
                                  MAX(st.id)       b_id,
                                  MAX(st.env_info) env_info,
                                  MAX(st.score)    score
                           FROM benchmark_version_score st
                           WHERE st.tech_stack = :techStack
                           GROUP BY st.p_id, st.VERSION) bvst
                          ON bvst.b_id = bt.b_id
               join view_projects p
                    on bt.p_id = p.p_id
      WHERE bt.raw_value IS NOT NULL
      ORDER BY bt.p_id, bt.benchmark, bt.created_at;`;

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
  pId?: number;
  patchId: string;
  envInfo: string;
  techStack?: string;
  bId?: number;
}

export async function importBenchmarkJson(data: {
  benchmark: BenchmarkValue[];
  benchmarkIndex: BenchmarkIndex[];
}) {
  const { benchmark, benchmarkIndex } = data;
  const errorInfo = `The necessary parameters are missing, the complete parameters are as follows：
    {
      benchmark: [{ techStack: string, projectName: string, displayName: string, 
                    benchmark: string, rawValue: number, platform: string, envInfo: string }],
      benchmarkIndex: [{ techStack: string, category: string, indexName: string, displayName: string, unit: string, order: number }]
    }
  `;
  if (!benchmark || !benchmarkIndex || !benchmark.length || !benchmarkIndex.length) {
    throw new Error(errorInfo);
  }

  const indexs = new Set();
  const benchmarkName = benchmark[0].techStack;

  benchmarkIndex.forEach(item => {
    if (
      !item.indexName ||
      !item.displayName ||
      !item.unit ||
      !item.category ||
      !item.order ||
      !item.techStack
    ) {
      throw new Error(errorInfo);
    }

    if (benchmarkName !== item.techStack) {
      throw new Error(
        `The list of Benchmark's tech stacks does not match, check the techStack field.`,
      );
    }

    indexs.add(item.indexName);
  });

  benchmark.forEach(item => {
    if (
      !item.projectName ||
      !item.displayName ||
      !item.benchmark ||
      !item.rawValue ||
      !item.platform ||
      !item.envInfo ||
      !item.techStack
    ) {
      throw new Error(errorInfo);
    }

    if (benchmarkName !== item.techStack) {
      throw new Error(
        `The list of Benchmark's tech stacks does not match, check the techStack field.`,
      );
    }

    if (!indexs.has(item.benchmark)) {
      throw new Error(
        `Benchmark metrics do not exist in the index collection, check for consistency between the benchmark and indexName fields.`,
      );
    }
  });

  const apply = {
    benchmarkName: benchmarkName,
    envInfo: benchmark[0].envInfo,
  };
  await setOthersParam4Benchmark(data.benchmark, apply);
  await fillBenchmarkBid(data.benchmark, apply);
  // call integration url to import benchmark data
  await importBenchmarkData({ benchmark, index: benchmarkIndex });
}

export async function importBenchmarkApply(applyUUID: string) {
  const apply = await NewProjectApply.findOne({
    where: {
      id: applyUUID,
      integrationFinishedTime: {
        [Op.is]: null,
      },
    },
  });

  // err if no benchmark apply
  if (!apply) {
    throw new Error(`Application record not found, please check the application record ID`);
  }

  const filePath = `${process.env.UPLOAD_PATH ?? '/root/upload'}/benchmark/${apply.filename}`;

  const fileBuffer = readFileSync(filePath);

  const data = await parseBenchmarkExcel2JSON(fileBuffer, apply.benchmarkName);

  await setOthersParam4Benchmark(data.benchmark, apply);

  await fillBenchmarkBid(data.benchmark, apply);
  // call integration url to import benchmark data
  await importBenchmarkData(data);

  const benchmarkTechStack = await BenchmarkTechStacks.findOne({
    where: {
      techStack: apply.benchmarkName,
    },
  });

  if (!benchmarkTechStack && !process.env.INTEGRATION_URL) {
    await BenchmarkTechStacks.create({
      techStack: apply.benchmarkName,
      approved: 0,
      category: apply.techStack,
      subcategory: apply.subTechStack,
    });
  }

  const pIds = data.benchmark.map(benchmark => benchmark.pId);
  // set integration finished time if not err
  await NewProjectApply.update(
    {
      // dont set finishedTime, bacause need time to sync data from outer into inner
      // integrationFinishedTime: new Date(),
      // set imported pId for this apply
      alternativePId: [...new Set(pIds)].join(','),
    },
    {
      where: {
        id: applyUUID,
      },
    },
  );

  return data;
}

async function fillBenchmarkBid(benchmarks: BenchmarkValue[], apply: any) {
  const hash = {};
  for (const benchmark of benchmarks) {
    if (hash[`${benchmark.pId}##${benchmark.displayName}`] !== undefined) {
      benchmark.bId = hash[`${benchmark.pId}##${benchmark.displayName}`];
      continue;
    }

    const responses = await requestFn(
      `${process.env.INTEGRATION_URL}/sync/benchmark/getBenchmarkVersionScore`,
      [{ benchmark: JSON.stringify(benchmark), apply: JSON.stringify(apply) }],
    );

    if (responses.length) {
      const bId = responses[0][0].description;
      benchmark.bId = bId;
      hash[`${benchmark.pId}##${benchmark.displayName}`] = bId;
    }
  }
}

/**
 * 不推荐使用，建议使用importBenchmarkApply
 * @see importBenchmarkApply
 * @deprecated
 */
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
    logger.warn('[benchmark] import benchmark without benchmark apply!');
  }
  const data = await parseBenchmarkExcel2JSON(file.buffer);
  await setOthersParam4Benchmark(data.benchmark, apply);
  // call integration url to import benchmark data
  await importBenchmarkData(data);
  const pIds = data.benchmark.map(benchmark => benchmark.pId);
  // set integration finished time if not err
  if (apply) {
    await NewProjectApply.update(
      {
        // dont set finishedTime, bacause need time to sync data from outer into inner
        // integrationFinishedTime: new Date(),
        // set imported pId for this apply
        alternativePId: [...new Set(pIds)].join(','),
      },
      {
        where: {
          filename,
        },
      },
    );
  }
  return data;
}

async function parseBenchmarkExcel2JSON(buffer: Buffer, benchmarkName?: string) {
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
  const versionReg = /(?<=[(（]).+(?=[)）])/;
  const benchmarkData: BenchmarkValue[] = [];
  const indexData: BenchmarkIndex[] = [];
  const techStackName: string = sheet.name.match(/(?<=<).+(?=>)/)?.[0];
  let order = 1;
  for (const row of rows) {
    const softwareName2Data = new Map<string, BenchmarkValue>();
    const index = {} as BenchmarkIndex;
    if (techStackName) {
      index.techStack = techStackName;
    }
    // 优先采用传入的
    if (benchmarkName) {
      index.techStack = benchmarkName;
    }

    const cellValues = row.values as CellValue[];
    for (let num = 1; num < cellValues.length; num++) {
      const cellVal = cellValues[num]?.toString()?.trim();
      if (!cellVal) {
        continue;
      }
      // skip notes
      if (cellVal.startsWith('注意事项')) {
        continue;
      }
      let indexRecord: { indexName: string };
      switch (num) {
        case 1:
          index.category = cellVal;
          index.order = order++;
          break;
        case 2:
          index.displayName = cellVal;
          indexRecord = await BenchmarkIndexPo.findOne({
            where: {
              techStack: index.techStack,
              category: index.category,
              displayName: index.displayName,
            },
          });
          index.indexName = indexRecord ? indexRecord.indexName : randomUUID();
          break;
        case 3:
          index.unit = cellVal;
          break;
        default: {
          // get softwareName
          const softwareNameAndVersion = header.getCell(num).value?.toString()?.trim();
          if (!softwareNameAndVersion) {
            continue;
          }
          const fullSoftwareName =
            softwareNameAndVersion.match(softwareReg)?.[0] ?? softwareNameAndVersion;
          const versionName = softwareNameAndVersion.match(versionReg)?.[0];
          if (!softwareName2Data.has(softwareNameAndVersion)) {
            softwareName2Data.set(softwareNameAndVersion, {
              benchmark: index.indexName,
              techStack: benchmarkName || '',
              projectName: fullSoftwareName,
              displayName: versionName || 'none',
              rawValue: Number(cellVal),
            } as BenchmarkValue);
          }
        }
      }
    }

    // 防止插入空行
    const indexKeysLen = Object.keys(index).length;
    if (index.techStack ? indexKeysLen - 1 : indexKeysLen) {
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
 * set pId and patchId for benchmark
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
    if (apply?.envInfo) {
      benchmark.platform = apply.envInfo;
    }
    if (!softwareName2Id.has(fullName)) {
      const project = await ViewProjects.findOne({
        where: {
          fullName: fullName,
        },
        attributes: ['p_id'],
      });
      if (!project) {
        throw new Error(`cant find project named:${fullName}`);
      }
      softwareName2Id.set(fullName, project.p_id);
    }
    benchmark.pId = softwareName2Id.get(fullName);
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

/**
 * query all tech stack
 *
 * @returns tech stack set result
 */
export async function queryAllTechStacks(): Promise<Array<BenchmarkTechStack>> {
  const sql = `SELECT tech_stack AS techStack,
                      description,
                      created_at AS createdAt,
                      category,
                      subcategory,
                      order_num  AS orderNum
               FROM benchmark_tech_stacks
               WHERE approved = 1`;

  const techStacksList = await sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
  });

  return techStacksList;
}
