import { sequelize } from '@orginjs/oss-evaluation-data-model';
import { QueryTypes } from 'sequelize';

export async function search(keyword) {
  const searchSql = `
    select distinct projects.full_name as fullName,
           projects.html_url as htmlName,
           projects.description ,
           projects.stargazers_count as stargazersCount
        from github_projects projects
    join project_packages packages
    on projects.id = packages.project_id
    where projects.full_name like concat('%',:keyword,'%') 
    order by stargazers_count desc
    limit 10`;
  return sequelize.query(searchSql, {
    type: QueryTypes.SELECT,
    replacements: { keyword },
  });
}
