import type { NewProjectApply as NewProjectApplyInterface } from '../interfaces/SoftwareInfo';
import { NewProjectApply, GithubProjectsTable } from '@orginjs/oss-evaluation-data-model';
import { Result } from '../utils/result.js';
import moment from 'moment';

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
): Promise<Result<string>> {
  const repoUrl = application.repoUrl;
  const email = application.applicantEmail;
  if (!repoUrl || !email) {
    return Result.fail(500, 'repoUrl/email is empty!');
  }
  application.createdAt = application.createdAt ?? new Date();
  const data = [];
  for (const url of repoUrl.split(';')) {
    data.push({
      ...application,
      repoUrl: url,
    });
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
