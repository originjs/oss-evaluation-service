import { ProjectPackage, GithubProjects } from '@orginjs/oss-evaluation-data-model';

/**
 * get software overview
 * @param packageName packageName
 * @returns {Promise<{firstCommit, license: *, star: *, language: *}>}
 */
// eslint-disable-next-line import/prefer-default-export
export async function getSoftwareOverview(packageName) {
  const packageInfo = await ProjectPackage.findOne({
    where: {
      package: packageName,
    },
  });
  const { projectId } = packageInfo;
  //   get star num
  const githubInfo = await GithubProjects.findOne({
    where: {
      id: projectId,
    },
  });

  return {
    star: githubInfo.stargazersCount,
    language: githubInfo.language,
    firstCommit: githubInfo.createdAt,
    license: githubInfo.license,
    description: githubInfo.description,
    tags: githubInfo.topics,
  };
}
