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
           (SELECT GROUP_CONCAT( distinct VERSION ORDER BY VERSION desc SEPARATOR '##') 
              FROM benchmark_version_score bvs 
             WHERE bvs.project_id = gp.id) version,
           (SELECT version 
              FROM benchmark_version_score bvs 
             WHERE bvs.project_id = gp.id ORDER BY score DESC LIMIT 1) selectedVersion
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

  projects.forEach(element => {
    element["versionList"] = element.version? element.version.split("##") : [];
    element["selectedVersions"] = [];
    element.selectedVersion && element["selectedVersions"].push(element.selectedVersion);
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
  SELECT t.index_name   as indexName,
    t.display_name as displayName,
    t.unit,
    t.category,
    t.description
  FROM benchmark_index t
  WHERE t.tech_stack = :techStack
  ORDER BY t.order;
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
    SELECT bt.project_id AS projectId,
          bt.project_name AS projectName,
          bt.display_name AS displayName, 
          benchmark,
          bt.raw_value AS rawValue,
          bt.created_at AS createdAt,
          bt.content,
          bt.platform,
          bvst.version,
          bvst.env_info AS envInfo,
          bvst.score
      FROM BENCHMARK bt
INNER JOIN (
    SELECT st.project_id, 
           st.VERSION, 
           MAX(st.id) b_id, 
           MAX(st.env_info) env_info,
           MAX(st.score) score
      FROM benchmark_version_score st
     WHERE st.tech_stack = :techStack
  GROUP BY st.project_id, st.VERSION) bvst 
        ON bvst.b_id = bt.b_id
     WHERE bt.raw_value IS NOT NULL
  ORDER BY bt.project_id, bt.BENCHMARK,bt.created_at;`;

  const indexes = await sequelize.query(sql, {
    replacements: { techStack },
    type: sequelize.QueryTypes.SELECT,
  });

  // format val
  for (const index of indexes) {
    if (isNumber(index?.rawValue)) {
      // rounding
      index.rawValue = fixedRound(index.rawValue, 3);
    }
  }

  return indexes;
}
