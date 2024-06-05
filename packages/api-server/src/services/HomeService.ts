import { sequelize } from '@orginjs/oss-evaluation-data-model';
import { QueryTypes } from 'sequelize';
import type { SoftwareBaseInfo } from '../interfaces/SoftwareInfo';

export async function searchProject(
  keyword: string,
  techStack: string,
): Promise<SoftwareBaseInfo[]> {
  const searchSql = `
    select projects.full_name as repoName,
           projects.html_url as url,
           projects.description,
           projects.owner_avatar_url as logo,
           projects.stargazers_count as star,
           full_name like concat(:keyword,'%') as prefix,
           full_name like concat('%',:keyword) as suffix
        from github_projects projects
    where projects.full_name like concat('%',:keyword,'%') 
    ${techStack ? 'and projects.id in (select distinct project_id from project_tech_stack where subcategory = :techStack)' : ''}
    order by prefix+suffix desc, stargazers_count desc
    limit 20`;
  return sequelize.query<SoftwareBaseInfo>(searchSql, {
    type: QueryTypes.SELECT,
    replacements: { keyword, techStack },
  });
}
