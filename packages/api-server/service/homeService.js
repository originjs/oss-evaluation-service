import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { Op } from 'sequelize';

// eslint-disable-next-line import/prefer-default-export
export async function search(keyword) {
  return GithubProjects.findAll({
    attributes: ['fullName', 'htmlUrl', 'description', 'stargazersCount'],
    where: {
      fullName: {
        [Op.like]: `%${keyword}%`,
      },
    },
    order: [
      ['stargazersCount', 'desc'],
    ],
    limit: 10,
  });
}
