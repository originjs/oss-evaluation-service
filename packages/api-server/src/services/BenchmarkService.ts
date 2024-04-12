import { sequelize } from '@orginjs/oss-evaluation-data-model';
import type {
  SoftwareBaseInfo,
  BenchmarkIndex,
  BenchmarkResult,
} from '../interfaces/SoftwareInfo.js';

/**
 * query projects by tech stack
 *
 * @param techStack Tech stack
 * @returns projects
 */
export async function queryProjectsByTechStack(
  techStack: string,
): Promise<Array<SoftwareBaseInfo>> {
  const sql = `
    SELECT gp.id as projectId,
           gp.NAME AS projectName,
           gp.full_name as repoName,
           gp.html_url as url,
           gp.description,
           gp.owner_avatar_url as logo,
           gp.stargazers_count as star,
           gp.forks_count as forksCount
      FROM github_projects gp
INNER JOIN project_tech_stack pts 
        ON gp.id = pts.project_id
     WHERE pts.category = :techStack
  ORDER BY gp.stargazers_count DESC;
  `;

  const projects = await sequelize.query(sql, {
    replacements: { techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  return projects;
}

/**
 * query benchmark indexs by tech stack
 *
 * @param techStack Tech stack
 * @returns indexs
 */
export async function queryIndexByTechStack(techStack: string): Promise<Array<BenchmarkIndex>> {
  const sql = `
    SELECT index_name as indexName,
       display_name as displayName,
                              unit,
                          category,
                       description  
      FROM benchmark_index 
     WHERE tech_stack = :techStack 
  ORDER BY category, 'ORDER';
  `;

  const indexs = await sequelize.query(sql, {
    replacements: { techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  return indexs;
}

/**
 * query benchmark result by tech stack
 *
 * @param techStack Tech stack
 * @returns benchmark result
 */
export async function getBenchmarkResultByTechStack(
  techStack: string,
): Promise<Array<BenchmarkResult>> {
  const sql = `
        SELECT project_id as projectId,
           project_name as projectName,
           display_name as displayName,
                             benchmark,
                 raw_value as rawValue,
               created_at as createdAt,
                               content,
                              platform
          FROM BENCHMARK
         WHERE tech_stack = :techStack 
      ORDER BY project_id, BENCHMARK,created_at;
  `;

  const indexs = await sequelize.query(sql, {
    replacements: { techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  return indexs;
}
