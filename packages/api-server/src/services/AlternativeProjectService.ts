import { AlternativeProjects, sequelize } from '@orginjs/oss-evaluation-data-model';
import { Op } from 'sequelize';
import type { AlternativeInfo } from '../interfaces/SoftwareInfo';

export async function getAlternativeProjects(repoName: string): Promise<AlternativeInfo[]> {
  const ALTERNATIVE_SIZE = 5;
  // similar project by
  let list = await AlternativeProjects.findAll({
    where: {
      fullName: repoName,
      alternativeId: { [Op.not]: null },
    },
    attributes: ['alternativeId', 'alternativeName', 'alternativeUrl'],
    order: [['distance', 'asc']],
  });
  const alternatives = list.map(item => {
    return {
      id: item.alternativeId,
      fullName: item.alternativeName,
      url: item.alternativeUrl,
    };
  });
  if (alternatives.length < ALTERNATIVE_SIZE) {
    // similar project by subcategory
    const sql = `SELECT id, full_name, g.html_url 
FROM github_projects g JOIN project_tech_stack t ON g.id = t.project_id 
WHERE subcategory IN ( SELECT subcategory FROM project_tech_stack WHERE html_url = :repoName ) 
ORDER BY stargazers_count DESC LIMIT ${ALTERNATIVE_SIZE + 1}`;
    list = await sequelize.query(sql, {
      replacements: { repoName: `https://github.com/${repoName}` },
      type: sequelize.QueryTypes.SELECT,
    });
    for (const item of list) {
      if (item.full_name === repoName)
        // exclude it self
        continue;
      alternatives.push({
        id: item.id,
        fullName: item.full_name,
        url: item.html_url,
      });

      if (alternatives.length >= ALTERNATIVE_SIZE) break;
    }
  }
  return alternatives;
}
