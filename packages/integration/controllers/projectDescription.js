import {
  ViewProjects,
  sequelize,
  logger,
  GithubProjectsTable,
  GiteeProjectsTable,
  GitcodeProjectsTable,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import JSON5 from 'json5';
import { chat } from '../../api-sdk/extChat.js';
import { platformTypes } from '@orginjs/oss-evaluation-util';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';

export async function syncProjectDescriptionHandler(req, res) {
  const { repoUrls } = req.body;
  if (repoUrls) {
    for (const repoUrl of repoUrls) {
      const project = await getProjectByUrl(repoUrl);
      if (!project) {
        logger.error('syncSingleProjectDescription: project not found', repoUrl);
        continue;
      }
      await syncSingleProjectDescription(project);
    }
  } else {
    syncAllProjectDescription();
  }
  res.status(200).json('ok');
}

export const DESCRIPTION_SYNC_STATUS = Object.freeze({
  UPDATED: 'updated',
  FAILED: 'failed',
});

export async function syncSingleProjectDescription(project) {
  logger.info('syncSingleProjectDescription: ' + project.fullName);
  if (!process.env.EXT_AI_SERVICE_URL) {
    return DESCRIPTION_SYNC_STATUS.FAILED;
  }

  const response = await chat(
    {
      GithubUrl: project.htmlUrl,
      docUrl: project.homePage,
      description: project.description,
      readme: project.readme || '',
    },
    process.env.EXT_PROJECT_DESCRIPTION_BOT,
  );

  if (!response.ok) {
    logger.error(`syncSingleProjectDescription: AI service returned ${response.status} for ${project.fullName}`);
    return DESCRIPTION_SYNC_STATUS.FAILED;
  }

  try {
    const rsp = await response.json();
    let json = rsp.data.outputs.result.replace(/<think>[\s\S]*?<\/think>(\n*)/, '');
    logger.info(json);
    if (json.startsWith('```')) {
      // remove markdown block
      json = json.substring(json.indexOf('\n'), json.lastIndexOf('\n'));
    }
    const content = JSON5.parse(json);
    const tableMap = {
      [platformTypes.GITHUB]: GithubProjectsTable,
      [platformTypes.GITEE]: GiteeProjectsTable,
      [platformTypes.GITCODE]: GitcodeProjectsTable,
    };
    await tableMap[project.platformType].update(
      { aiDescription: content },
      { where: { pId: project.pId } },
    );
    return DESCRIPTION_SYNC_STATUS.UPDATED;
  } catch (e) {
    logger.error('Update project ai description failed! Skip it.', e);
    return DESCRIPTION_SYNC_STATUS.FAILED;
  }
}

export async function syncAllProjectDescription() {
  let sql = `SELECT p.p_id, p.full_name, p.html_url, p.home_page, p.description, p.id, p.platform_type
             from view_projects p
             where ai_description is null`;
  const projects = await sequelize.query(sql, {
    model: ViewProjects,
    mapToModel: true,
    type: sequelize.QueryTypes.SELECT,
  });
  let updated = 0;
  let failed = 0;
  for (const project of projects) {
    const status = await syncSingleProjectDescription(project);
    if (status === DESCRIPTION_SYNC_STATUS.UPDATED) updated += 1;
    else failed += 1;
  }
  return { updated, failed, total: projects.length };
}

export const projectDescriptionTimer = addMonitoringToTask(
  async function () {
    if (!process.env.EXT_AI_SERVICE_URL || !process.env.EXT_PROJECT_DESCRIPTION_BOT) {
      logger.warn('[Integration][ProjectDescription] AI service not configured, skip task');
      return;
    }
    const startTime = process.hrtime();
    logger.info('[Integration][ProjectDescription] Integration Job start');
    const result = await syncAllProjectDescription();
    logger.info(
      `[Integration][ProjectDescription] Integration Job end: updated=${result.updated}, failed=${result.failed}, total=${result.total}`,
    );
    if (result.total > 0 && result.updated === 0) {
      throw new Error(
        `All ${result.total} projects failed to sync AI description, provider may be unavailable`,
      );
    }
    const endTime = process.hrtime(startTime);
    logger.info(
      `[Integration][ProjectDescription] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
    );
  },
  'projectDescriptionTimer',
  '周三 04:00 同步 AI 项目描述',
);
