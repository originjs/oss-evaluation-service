import {
  ViewProjects,
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
      try {
        const content = JSON5.parse(json);
        await GithubProjectsTable.update(
          { aiDescription: content },
          { where: { pId: project.pId } },
        );
      } catch (e) {
        logger.error('Parse json data failed! Skip it.', json, e);
      }
    }
  }
}

export async function syncAllProjectDescription() {
  let sql = `SELECT p.p_id, p.full_name, p.html_url, p.home_page, p.description
             from view_projects p
             where ai_description is null`;
  const projects = await sequelize.query(sql, {
    model: ViewProjects,
    mapToModel: true,
    type: sequelize.QueryTypes.SELECT,
  });
  for (const project of projects) {
    await syncSingleProjectDescription(project);
  }
}
