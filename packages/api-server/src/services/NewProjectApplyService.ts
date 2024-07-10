import type { NewProjectApply as NewProjectApplyInterface } from '../interfaces/SoftwareInfo';
import { NewProjectApply } from '@orginjs/oss-evaluation-data-model';
import { Result } from '../utils/result.js';

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
