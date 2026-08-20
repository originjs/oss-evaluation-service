import {
  AlternativeProjects,
  sequelize,
  logger,
  ViewProjects,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import JSON5 from 'json5';
import { chat } from '../../api-sdk/extChat.js';
import CozeSdk from '@orginjs/coze-sdk';
import { addMonitoringToTask } from '../scheduler/schdulerMonitor.js';

export async function syncAlternativeHandler(req, res) {
  const { repoUrls, pIds } = req.body;
  if (repoUrls) {
    for (const repoUrl of repoUrls) {
      const project = await getProjectByUrl(repoUrl);
      if (!project) {
        logger.error('syncSingleProjectAlternative: project not found', repoUrl);
        continue;
      }
      let retryCount = 0;
      while (retryCount !== -1 && retryCount < 5) {
        try {
          await syncSingleProjectAlternative(project);
          retryCount = -1;
        } catch (e) {
          retryCount++;
          logger.error(`syncSingleProjectAlternative failed! Retry count: ${retryCount}\n`, e);
        }
      }
      await updateProjectId();
    }
    res.status(200).json('ok');
  } else if (pIds) {
    for (const pId of pIds) {
      const project = await ViewProjects.findByPk(pId);
      await syncSingleProjectAlternative(project);
    }
    await updateProjectId();
    res.status(200).json('ok');
  } else {
    // sync all
    syncAllProjectAlternative();
    res.status(200).json('ok');
  }
}

const ALTERNATIVE_SYNC_STATUS = Object.freeze({
  UPDATED: 'updated',
  FAILED: 'failed',
});

export async function syncAllProjectAlternative() {
  let sql = `SELECT p.p_id, p.full_name, p.html_url, p.id, p.platform_type, p.description, p.topics
             from view_projects p
             where p.p_id NOT IN (SELECT DISTINCT p_id FROM alternative_projects)`;
  const projects = await sequelize.query(sql, {
    model: ViewProjects,
    mapToModel: true,
    type: sequelize.QueryTypes.SELECT,
  });
  let updated = 0;
  let failed = 0;
  for (const project of projects) {
    const status = await syncSingleProjectAlternative(project);
    if (status === ALTERNATIVE_SYNC_STATUS.UPDATED) updated += 1;
    else failed += 1;
  }
  // update project id
  await updateProjectId();
  return { updated, failed, total: projects.length };
}

const saveAltList = async (json, project) => {
  logger.info(json);
  if (json.startsWith('```')) {
    // remove markdown block
    json = json.substring(json.indexOf('\n'), json.lastIndexOf('\n'));
  }
  const content = JSON5.parse(json);
  if (content.data && content.data.length > 0) {
    const altList = [];
    for (const line of content.data) {
      if (!line[0].startsWith('https://')) continue;
      // exclude duplicate
      if (altList.find(e => e.alternativeUrl === line[0])) continue;
      // exclude self
      if (line[0] === project.htmlUrl) continue;
      altList.push({
        pId: project.pId,
        fullName: project.fullName,
        alternativeUrl: line[0],
        distance: line[1],
        source: 'ai',
      });
    }
    if (altList.length > 0) {
      await AlternativeProjects.bulkCreate(altList, {
        updateOnDuplicate: ['distance'],
      });
    } else {
      // All candidates filtered, write sentinel to mark completion
      await AlternativeProjects.upsert({
        pId: project.pId,
        fullName: project.fullName,
        alternativeUrl: '__NO_ALTERNATIVE__',
        source: 'ai_skip',
      });
    }
  } else {
    // AI returned empty list, write sentinel to mark completion
    await AlternativeProjects.upsert({
      pId: project.pId,
      fullName: project.fullName,
      alternativeUrl: '__NO_ALTERNATIVE__',
      source: 'ai_skip',
    });
  }
  // AI responded successfully, empty result is valid (no alternatives found)
  return true;
};

export async function syncSingleProjectAlternative(project) {
  logger.info('syncSingleProjectAlternative: ' + project.fullName);

  let response;
  if (process.env.EXT_AI_SERVICE_URL) {
    response = await chat(
      {
        GithubUrl: project.htmlUrl,
        topics: project.topics || '',
        description: project.description,
        readme: project.readme || '',
      },
      process.env.EXT_ALTERNATIVE_BOT,
    );
    if (!response.ok) {
      logger.error(
        `syncSingleProjectAlternative: AI service returned ${response.status} for ${project.fullName}`,
      );
      return ALTERNATIVE_SYNC_STATUS.FAILED;
    }
    const rsp = await response.json();
    try {
      await saveAltList(
        rsp.data.outputs.result.replace(/<think>[\s\S]*?<\/think>(\n*)/, ''),
        project,
      );
      return ALTERNATIVE_SYNC_STATUS.UPDATED;
    } catch (e) {
      logger.error(`Save alternative list failed! \n${e}`);
      return ALTERNATIVE_SYNC_STATUS.FAILED;
    }
  } else if (process.env.COZE_API_TOKEN) {
    const cozeSdk = new CozeSdk(CozeSdk.ALTERNATIVE_BOT);
    response = await cozeSdk.chat(project.htmlUrl);
    if (!response.ok) {
      logger.error(
        `syncSingleProjectAlternative: Coze returned ${response.status} for ${project.fullName}`,
      );
      return ALTERNATIVE_SYNC_STATUS.FAILED;
    }
    const rsp = await response.json();
    if (rsp.code !== 0) {
      logger.warn(`Coze alternative project failed: ${rsp.msg}`);
      return ALTERNATIVE_SYNC_STATUS.FAILED;
    }
    for (const msg of rsp.messages) {
      if (msg.type === 'answer') {
        try {
          await saveAltList(msg.content, project);
          return ALTERNATIVE_SYNC_STATUS.UPDATED;
        } catch (e) {
          logger.error(`Save alternative list from Coze failed! \n${e}`);
          return ALTERNATIVE_SYNC_STATUS.FAILED;
        }
      }
    }
    return ALTERNATIVE_SYNC_STATUS.FAILED;
  }

  logger.warn('[Integration][ProjectAlternative] No AI provider configured');
  return ALTERNATIVE_SYNC_STATUS.FAILED;
}

export async function updateProjectId() {
  const approvedSql = `UPDATE alternative_projects t1 INNER JOIN view_projects t2 ON t1.alternative_url = t2.html_url
                       SET t1.alternative_id= t2.p_id,
                           t1.alternative_name = t2.full_name,
                           t1.approved=1
                       WHERE t1.alternative_id IS NULL`;
  const notApprovedSql = `UPDATE alternative_projects t1 INNER JOIN view_projects t2 ON t1.alternative_url = t2.html_url
                          SET t1.alternative_id= t2.p_id,
                              t1.alternative_name = t2.full_name,
                              t1.approved=0
                          WHERE t1.alternative_id IS NULL
                            AND t1.approved IS NULL;`;

  await sequelize.query(approvedSql);
  await sequelize.query(notApprovedSql);
}

export const projectAlternativeTimer = addMonitoringToTask(
  async function () {
    const hasExternalAI = process.env.EXT_AI_SERVICE_URL && process.env.EXT_ALTERNATIVE_BOT;
    const hasCoze = !!process.env.COZE_API_TOKEN;
    if (!hasExternalAI && !hasCoze) {
      logger.warn('[Integration][ProjectAlternative] AI service not configured, skip task');
      return;
    }
    const startTime = process.hrtime();
    logger.info('[Integration][ProjectAlternative] Integration Job start');
    const result = await syncAllProjectAlternative();
    logger.info(
      `[Integration][ProjectAlternative] Integration Job end: updated=${result.updated}, failed=${result.failed}, total=${result.total}`,
    );
    if (result.failed > 0) {
      throw new Error(
        `AI sync alternative failed: ${result.failed}/${result.total} projects failed, provider may be unavailable`,
      );
    }
    const endTime = process.hrtime(startTime);
    logger.info(
      `[Integration][ProjectAlternative] The total time spent on integration : ${endTime[0]}s ${endTime[1] / 1e6}ms`,
    );
  },
  'projectAlternativeTimer',
  '周二 04:00 同步 AI 相似软件推荐',
);

export async function syncClassificationHandler(req, res) {
  const { repoUrl, pIds } = req.body;
  if (repoUrl) {
    // sync single project
    const project = await getProjectByUrl(repoUrl);
    const result = await getSingleProjectClassification(project);
    res.status(200).json(result);
  } else if (pIds) {
    for (const pId of pIds) {
      const project = await ViewProjects.findByPk(pId);
      if (!project) {
        logger.error('getSingleProjectClassification: project not found', repoUrl);
        continue;
      }
      await getSingleProjectClassification(project);
    }
    await updateProjectId();
    res.status(200).json('ok');
  } else {
    // sync all
    syncAllProjectAlternative();
    res.status(200).json('ok');
  }
}

export async function getSingleProjectClassification(project) {
  logger.info('getSingleProjectClassification: ' + project.fullName);
  const cozeSdk = new CozeSdk(CozeSdk.CLASSIFICATION_BOT);
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
          const content = JSON5.parse(json);
          if (content.tags && content.tags.length > 0) {
            project.openAiRemark = JSON.stringify(content.tags);
          }
          if (content.description) {
            project.openAiRecommendRemark = content.description;
          }
          project.save();
          return content;
        } catch (e) {
          logger.error(e);
        }
      }
    }
  }
}
