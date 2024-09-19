import { sequelize } from '@orginjs/oss-evaluation-data-model';
import { QueryTypes } from 'sequelize';
import type { SoftwareBaseInfo, TechRadarItem } from '../interfaces/SoftwareInfo';

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

export async function getRadarList(): Promise<TechRadarItem[]> {
  const sql = `select project_id as id, name as label,radar_quadrant as quadrant,radar_ring as ring,radar_moved as moved,
      CONCAT('/#/software-details?repoName=',full_name) as link
      from project_tech_stack where radar_ring is not null`;
  return sequelize.query<SoftwareBaseInfo>(sql, {
    type: QueryTypes.SELECT,
  });
}
