import { AlternativeProjects, GithubProjects, sequelize, logger } from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import CozeSdk from '@orginjs/coze-sdk';

export async function syncAlternativeHandler(req, res) {
  const { repoUrl } = req.body;
  // sync all
  if (!repoUrl) {
    syncAllProjectAlternative();
    res.status(200).json('ok');
  } else {
    // sync single project
    const project = await getProjectByUrl(repoUrl);
    const result = await syncSingleProjectAlternative(project);
    res.status(200).json(result);
  }
}

export async function syncAllProjectAlternative() {
  let sql = `SELECT g.id,g.full_name,g.html_url from github_projects g LEFT JOIN project_tech_stack t 
    ON g.id = t.project_id where subcategory is null and integrated_state=2
    AND g.id NOT IN(SELECT DISTINCT project_id FROM alternative_projects)`;
  const projects = await sequelize.query(sql, {
    model: GithubProjects,
    mapToModel: true,
    type: sequelize.QueryTypes.SELECT,
  });
  for (const project of projects) {
    await syncSingleProjectAlternative(project);
  }
  // update project id
  sql = `UPDATE alternative_projects t1 INNER JOIN github_projects t2
  ON t1.alternative_url= t2.html_url SET t1.alternative_id= t2.id, t1.alternative_name = t2.full_name`;
  await sequelize.query(sql);
}

export async function syncSingleProjectAlternative(project) {
  const cozeSdk = new CozeSdk();
  const response = await cozeSdk.chat(project.htmlUrl);
  if (response.ok) {
    const rsp = await response.json();
    for (const msg of rsp.messages) {
      if (msg.type === 'answer') {
        let json = msg.content;
        logger.info(json);
        if (json.startsWith('```')) {
          // remove markdown block
          json = json.substring(json.indexOf('\n'), json.lastIndexOf('\n'));
        }
        try {
          const content = JSON.parse(json);
          if (content.data && content.data.length > 0) {
            const altList = [];
            for (const line of content.data) {
              if (!line[0].startsWith('https://')) continue;
              // eclude duplicate
              if (altList.find(e => e.alternativeUrl === line[0])) continue;
              altList.push({
                projectId: project.id,
                fullName: project.fullName,
                alternativeUrl: line[0],
                distance: line[1],
                source: 'ai',
              });
            }
            await AlternativeProjects.bulkCreate(altList);
          }
        } catch (e) {
          logger.error(e);
        }
      }
    }
  }
}
