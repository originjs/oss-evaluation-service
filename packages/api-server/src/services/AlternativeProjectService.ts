import { AlternativeProjects, GithubProjects, sequelize } from '@orginjs/oss-evaluation-data-model';
import type { AlternativeInfo } from '../interfaces/SoftwareInfo';

AlternativeProjects.hasOne(GithubProjects, { foreignKey: 'alternative_id' });

export async function getAlternativeProjects(fullName: string): Promise<AlternativeInfo[]> {
  const ALTERNATIVE_SIZE = 6;
  // similar project by ai
  let sql = `SELECT alternative_id,
                    alternative_name,
                    alternative_url,
                    source,
                    owner_avatar_url,
                    description,
                    stargazers_count as starCount,
                    forks_count      as forksCount
             FROM alternative_projects a
                      LEFT JOIN github_projects g ON a.alternative_id = g.id
             WHERE a.full_name = :fullName
               AND approved = 1
             ORDER BY distance
             LIMIT ${ALTERNATIVE_SIZE}`;
  let list = await sequelize.query(sql, {
    replacements: { fullName },
    type: sequelize.QueryTypes.SELECT,
  });
  const alternatives = list.map(item => {
    return {
      id: item.alternative_id,
      repoName: item.alternative_name,
      logo: item.owner_avatar_url,
      starCount: item.starCount,
      forksCount: item.forksCount,
      url: item.alternative_url,
      description: item.description,
      ai: item.source === 'ai' ? 1 : 0,
    };
  });
  // similar project by category and subcategory
  sql = `SELECT id,
                g.full_name,
                g.html_url,
                g.owner_avatar_url as logo,
                description,
                g.stargazers_count as starCount,
                g.forks_count      as forksCount
         FROM github_projects g
                  JOIN project_tech_stack t ON g.id = t.project_id
         WHERE category IN (SELECT category FROM project_tech_stack WHERE html_url = :repoName)
           and subcategory IN (SELECT subcategory FROM project_tech_stack WHERE html_url = :repoName)
         ORDER BY stargazers_count DESC`;
  list = await sequelize.query(sql, {
    replacements: { repoName: `https://github.com/${fullName}` },
    type: sequelize.QueryTypes.SELECT,
  });
  for (const item of list) {
    // exclude it self
    if (item.full_name === fullName) continue;

    const alternative = alternatives.find(e => e.repoName === item.full_name);
    if (alternative) {
      alternative.ai = 0; // mark as non-AI
      continue; // exclude exist
    }

    if (alternatives.length < ALTERNATIVE_SIZE) {
      alternatives.push({
        id: item.id,
        repoName: item.full_name,
        logo: item.logo,
        starCount: item.starCount,
        forksCount: item.forksCount,
        url: item.html_url,
        description: item.description,
      });
    }
  }

  return alternatives;
}
