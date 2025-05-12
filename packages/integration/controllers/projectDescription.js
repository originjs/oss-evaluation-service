import {
  GithubProjects,
  sequelize,
  logger,
  GithubProjectsTable,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import JSON5 from 'json5';
import { chat } from '../../api-sdk/extChat.js';

export async function syncProjectDescriptionHandler(req, res) {
  const { repoUrls } = req.body;
  if (repoUrls) {
    for (const repoUrl of repoUrls) {
      const project = await getProjectByUrl(repoUrl);
      await syncSingleProjectDescription(project);
    }
  } else {
    syncAllProjectDescription();
  }
  res.status(200).json('ok');
}

export async function syncSingleProjectDescription(project) {
  logger.info('syncSingleProjectDescription: ' + project.fullName);
  if (process.env.EXT_AI_SERVICE_URL) {
    const response = await chat(
      {
        GithubUrl: project.htmlUrl,
        docUrl: project.homePage,
        description: project.description,
        readme: project.readme || '',
      },
      process.env.EXT_PROJECT_DESCRIPTION_BOT,
    );

    if (response.ok) {
      const rsp = await response.json();
      let json = rsp.data.outputs.result.replace(/<think>[\s\S]*?<\/think>(\n*)/, '');
      logger.info(json);
      if (json.startsWith('```')) {
        // remove markdown block
        json = json.substring(json.indexOf('\n'), json.lastIndexOf('\n'));
      }
      const content = JSON5.parse(json);
      if (content) {
        await GithubProjectsTable.update({ aiDescription: content }, { where: { id: project.id } });
      }
    }
  }
}

export async function syncAllProjectDescription() {
  let sql = `SELECT g.id, g.full_name, g.html_url, g.home_page, g.description
             from github_projects g
             where ai_description is null`;
  const projects = await sequelize.query(sql, {
    model: GithubProjects,
    mapToModel: true,
    type: sequelize.QueryTypes.SELECT,
  });
  for (const project of projects) {
    await syncSingleProjectDescription(project);
  }
}
