import type { NewProjectApply as NewProjectApplyInterface } from '../interfaces/SoftwareInfo';
import { NewProjectApply, GithubProjectsTable } from '@orginjs/oss-evaluation-data-model';
import { Result } from '../utils/result.js';
import moment from 'moment';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
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
    },
  });
  return historyApplication ? Result.ok(true) : Result.ok(false);
}
