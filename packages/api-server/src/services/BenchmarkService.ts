import { sequelize } from '@orginjs/oss-evaluation-data-model';
import type {
  SoftwareBaseInfo,
  BenchmarkIndex,
  BenchmarkResult,
} from '../interfaces/SoftwareInfo.js';
import { isNumber } from 'underscore';
import { fixedRound } from '../utils/math.js';

/**
 * query projects by tech stack
 *
 * @param category category
 * @param techStack Tech stack
 * @returns projects
 */
export async function queryProjectsByTechStack(
  category: string,
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
           gp.forks_count as forksCount,
           (SELECT GROUP_CONCAT( distinct VERSION ORDER BY VERSION desc  SEPARATOR '##')  FROM benchmark_version_score bvs WHERE bvs.project_id = gp.id) version
      FROM github_projects gp
INNER JOIN project_tech_stack pts 
        ON gp.id = pts.project_id
     WHERE pts.category = :category
       AND pts.subcategory = :techStack
  ORDER BY gp.stargazers_count DESC;
  `;

  const projects = await sequelize.query(sql, {
    replacements: { category, techStack },
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
          WHERE patch_id = (
            SELECT MAX(patch_id)
            FROM BENCHMARK
            WHERE tech_stack = :techStack) 
          and raw_value is not null
      ORDER BY project_id, BENCHMARK,created_at;
  `;

  const indexes = await sequelize.query(sql, {
    replacements: { techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  // format val
  for (const index of indexes) {
    if (isNumber(index?.rawValue)) {
      // rounding
      index.rawValue = fixedRound(index.rawValue, 2);
    }
  }

  return indexes;
}
