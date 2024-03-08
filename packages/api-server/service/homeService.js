import { GithubProjects } from '@orginjs/oss-evaluation-data-model';
import { Op } from 'sequelize';

// eslint-disable-next-line import/prefer-default-export
export async function search(keyword) {
  return GithubProjects.findAll({
    attributes: ['full_name', 'html_url', 'description', 'stargazers_count'],
    where: {
      fullName: {
        [Op.like]: `%${keyword}%`,
      },
    },
    order: [
      ['stargazers_count', 'desc'],
    ],
    limit: 10,
  });
}
