import type { NewProjectApply as NewProjectApplyInterface } from '../interfaces/SoftwareInfo';
import { NewProjectApply, GithubProjectsTable } from '@orginjs/oss-evaluation-data-model';
import { Result } from '../utils/result.js';
import moment from 'moment';
import type { UploadedFile } from 'express-fileupload';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'node:fs';

const uploadDir = process.env.UPLOAD_DIR;
export async function getApplyRecordByEmployeeNumber(employeeNumber: string) {
  const list = await NewProjectApply.findAll({
    where: {
      employeeNumber,
    },
    attributes: ['type', 'repoUrl', 'alternativeProjectId', 'createdAt', 'state'],
  });

  if (!list?.length) {
    return;
  }
  const regexp = new RegExp(/(?<=https?:\/\/github.com\/)[a-zA-Z0-9_-]+?\/[a-zA-Z0-9_-]+/, 'i');
  for (const val of list) {
    // format date
    val.dataValues.createdAt = moment(val.createdAt).format('YYYY-MM-DD HH:mm:ss');
    val.dataValues.fullName = val.repoUrl?.match(regexp)?.[0];
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
  file: UploadedFile,
): Promise<Result<string>> {
  const repoUrl = application.repoUrl;
  const email = application.applicantEmail;
  if (!repoUrl || !email) {
    return Result.fail(500, 'repoUrl/email is empty!');
  }
  application.createdAt = application.createdAt ?? new Date();
  const data = [];
  if (application?.type !== 3) {
    // handle batch apply
    for (const url of repoUrl.split(';')) {
      data.push({
        ...application,
        repoUrl: url,
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
    const filename = `${moment(new Date()).format('YYYY-MM-DD_HH:mm:ss')}-${Buffer.from(file.name, 'latin1').toString('utf8')}`;
    const mvFilePath = `${uploadDir}/benchmark/${filename}`;
    const dir = dirname(mvFilePath);
    if (!existsSync(dir)) {
      mkdirSync(dir);
    }
    await file.mv(mvFilePath);
    application.filename = filename;
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
    },
  });
  return historyApplication ? Result.ok(true) : Result.ok(false);
}
