import type { NewProjectApply as NewProjectApplyInterface } from '../interfaces/SoftwareInfo';
import { NewProjectApply, GithubProjectsTable } from '@orginjs/oss-evaluation-data-model';
import { Result } from '../utils/result.js';
import moment from 'moment';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import exceljs from 'exceljs';
import { Readable } from 'node:stream';
export async function getApplyRecordByEmployeeNumber(
  employeeNumber: string,
  buName: string,
  isBuOwner: boolean,
) {
  let filterOpt = {};

  if (isBuOwner) {
    filterOpt = {
      buName,
      deleted: false,
    };
  } else {
    filterOpt = {
      employeeNumber,
      deleted: false,
    };
  }
  const list = await NewProjectApply.findAll({
    where: filterOpt,
    attributes: [
      'id',
      'type',
      'techStack',
      'subTechStack',
      'repoUrl',
      'alternativeProjectId',
      'username',
      'buName',
      'isBuOwner',
      'createdAt',
      'state',
      'reason',
    ],
    order: [['createdAt', 'DESC']],
  });

  if (!list?.length) {
    return;
  }
  const regexpGit = new RegExp(/(?<=https?:\/\/github.com\/)[a-zA-Z0-9_-]+?\/[a-zA-Z0-9_-]+/, 'i');
  const regexpGitee = new RegExp(/(?<=https?:\/\/gitee.com\/)[a-zA-Z0-9_-]+?\/[a-zA-Z0-9_-]+/, 'i');
  for (const val of list) {
    // format date
    val.dataValues.createdAt = moment(val.createdAt).format('YYYY-MM-DD HH:mm:ss');
    val.dataValues.fullName =
      val.repoUrl?.match(regexpGit)?.[0] || val.repoUrl?.match(regexpGitee)?.[0];
    val.dataValues.softwareName = val.dataValues.fullName
      ? val.dataValues.fullName.split('/').pop() || ''
      : '';
    if (val.type === 2 && val.alternativeProjectId) {
      const githubProject = await GithubProjectsTable.findOne({
        where: {
          id: val.alternativeProjectId,
        },
        attributes: ['htmlUrl', 'fullName'],
      });
      // set alternative project
      val.dataValues.alternativeProjectRepoUrl = githubProject?.htmlUrl;
      val.dataValues.alternativeProjectFullName = githubProject?.fullName;
    }
  }
  return list;
}

export async function newProjectApply(
  application: NewProjectApplyInterface,
  file: Express.Multer.File,
): Promise<Result<string>> {
  const email = application.applicantEmail;
  if (!email?.includes('@')) {
    return Result.fail(500, 'email is invalid!');
  }
  application.createdAt = application.createdAt ?? new Date();
  const data = [];
  if (application?.type !== 3) {
    const repoUrl = application.repoUrl;
    if (!repoUrl) {
      return Result.fail(500, 'repoUrl is empty!');
    }
    // Process each repository URL in batch mode
    const urls = repoUrl.split(';');
    for (const url of urls) {
      // Normalize URL by trimming and removing .git suffix if present
      const normalizedUrl = url.trim().endsWith('.git') ? url.trim().slice(0, -4) : url.trim();
      data.push({
        ...application,
        repoUrl: normalizedUrl,
      });
    }
  } else {
    // benchmark type
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    // not excel file
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return Result.fail(400, 'Invalid file type. Only Excel files are allowed.');
    }
    if (file.size > 10 * 1024 * 1024) {
      return Result.fail(400, 'File size is too large');
    }
    // move file
    application.filename = `${moment(new Date()).format('yyyyMMDDHHmmssSSS')}_${Buffer.from(file.originalname, 'latin1').toString()}`;
    const dir = `${process.env.UPLOAD_PATH ?? '/root/upload'}/benchmark`;
    const filePath = `${dir}/${application.filename}`;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, file.buffer);
    data.push(application);
  }
  await NewProjectApply.bulkCreate(data);
  return Result.ok(`success`);
}

export async function existsApplication(
  username: string,
  repoUrl: string,
): Promise<Result<boolean>> {
  if (!username || !repoUrl) {
    return Result.fail(500, 'username/repoUrl is empty!');
  }
  const historyApplication = await NewProjectApply.findOne({
    where: {
      username,
      repoUrl,
      deleted: false,
    },
  });
  return historyApplication ? Result.ok(true) : Result.ok(false);
}

export async function deleteApplicationById(
  id: string,
  employeeNumber: string,
): Promise<Result<boolean>> {
  if (!id) {
    return Result.fail(500, 'id is empty!');
  }
  const rowsAffected = await NewProjectApply.update(
    { deleted: true },
    {
      where: {
        id,
        employeeNumber,
        deleted: false,
      },
    },
  );
  if (rowsAffected[0] === 0) {
    return Result.fail(404, 'application not found');
  }
  return Result.ok(true);
}

export async function exportApplyRecordToExcel(
  employeeNumber: string,
  buName: string,
  isBuOwner: boolean,
) {
  const list = await getApplyRecordByEmployeeNumber(employeeNumber, buName, isBuOwner);
  if (!list?.length) {
    return null;
  }

  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('申请记录');

  const headers = [
    '类型',
    '软件名称',
    '技术栈',
    '子技术栈',
    '社区源码仓地址',
    '申请人',
    'BU名称',
    '申请时间',
    '进展',
    '原因',
  ];
  const statusMapping = {
    1: 'Submit Application',
    2: 'In the process of data collection',
    3: 'Collection completed',
    4: 'Suspend',
    5: 'Reject',
  };

  const typeMapping = {
    1: 'New project application',
    2: 'Similar software application',
    3: 'Benchmark software application',
  };

  worksheet.addRow(headers);
  for (const item of list) {
    const rowData = [
      statusMapping[item.type],
      item.dataValues.softwareName,
      item.techStack,
      item.subTechStack,
      item.repoUrl,
      item.username.concat(' ').concat(item.employeeNumber ? item.employeeNumber : ''),
      item.buName,
      item.createdAt,
      typeMapping[item.state],
      item.reason,
    ];
    worksheet.addRow(rowData);
  }
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  const buffer = await workbook.xlsx.writeBuffer();

  if (!buffer) {
    throw new Error('No data to export');
  }

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
