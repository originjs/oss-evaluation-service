import {
  AlternativeProjects,
  sequelize,
  logger,
  ViewProjects,
} from '@orginjs/oss-evaluation-data-model';
import { getProjectByUrl } from '../util/util.js';
import JSON5 from 'json5';
import CozeSdk from '@orginjs/coze-sdk';
import { chat } from '../../api-sdk/extChat.js';

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

export async function syncAllProjectAlternative() {
  let sql = `SELECT p.p_id, p.full_name, p.html_url, p.id, p.platform_type
             from view_projects p
                      LEFT JOIN project_tech_stack t
                                ON p.p_id = t.p_id
             where subcategory is null
               and integrated_state & 2 != 0
               AND p.p_id NOT IN (SELECT DISTINCT p_id FROM alternative_projects)`;
  const projects = await sequelize.query(sql, {
    model: ViewProjects,
    mapToModel: true,
    type: sequelize.QueryTypes.SELECT,
  });
  for (const project of projects) {
    await syncSingleProjectAlternative(project);
  }
  // update project id
  await updateProjectId();
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
      if (line[0] === 'https://github.com/' + project.fullName) continue;
      altList.push({
        pId: project.pId,
        fullName: project.fullName,
        alternativeUrl: line[0],
        distance: line[1],
        source: 'ai',
      });
    }
    await AlternativeProjects.bulkCreate(altList, {
      updateOnDuplicate: ['distance'],
    });
    return altList;
  }
};

export async function syncSingleProjectAlternative(project) {
  logger.info('syncSingleProjectAlternative: ' + project.fullName);
  if (process.env.EXT_AI_SERVICE_URL) {
    const response = await chat(
      {
        GithubUrl: project.htmlUrl,
        topics: project.topics || '',
        description: project.description,
        readme: project.readme || '',
      },
      process.env.EXT_ALTERNATIVE_BOT,
    );
    if (response.ok) {
      const rsp = await response.json();
      return await saveAltList(
        rsp.data.outputs.result.replace(/<think>[\s\S]*?<\/think>(\n*)/, ''),
        project,
      );
    }
  } else {
    const cozeSdk = new CozeSdk(CozeSdk.ALTERNATIVE_BOT);
    const response = await cozeSdk.chat(project.htmlUrl);
    if (response.ok) {
      const rsp = await response.json();
      if (rsp.code !== 0) {
        logger.warn(`Coze alternative project failed: ${rsp.msg}`);
        return;
      }
      for (const msg of rsp.messages) {
        if (msg.type === 'answer') {
          const altList = await saveAltList(msg.content, project);
          if (altList) {
            return altList;
          }
        }
      }
    }
  }
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
