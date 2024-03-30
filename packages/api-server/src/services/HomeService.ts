import { sequelize } from '@orginjs/oss-evaluation-data-model';
import { QueryTypes } from 'sequelize';
import type { SoftwareBaseInfo } from '../interfaces/SoftwareInfo';

export async function searchProject(keyword: string, techStack: string): Promise<SoftwareBaseInfo[]> {
  const searchSql = `
    select distinct projects.full_name as repoName,
           projects.html_url as url,
           projects.description,
           projects.owner_avatar_url as logo,
           projects.stargazers_count as star
        from github_projects projects
    join project_packages packages
    on projects.id = packages.project_id
    where projects.full_name like concat('%',:keyword,'%') 
    ${techStack ? 'and projects.id in (select distinct project_id from project_tech_stack where subcategory = :techStack)' : ''}
    order by stargazers_count desc
    limit 10`;
  return sequelize.query<SoftwareBaseInfo>(searchSql, {
    type: QueryTypes.SELECT,
    replacements: { keyword, techStack },
  });
}
