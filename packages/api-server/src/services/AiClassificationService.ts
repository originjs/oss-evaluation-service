import {
  GithubProjectsTable,
  ProjectStackFromAi,
  LandscapeProjects,
  logger,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import https from 'https';
import axios from 'axios';
import json5 from 'json5';
import { Op } from 'sequelize';
import type { RepoInfo, RepoList } from '../interfaces/SoftwareInfo';

const apiUrl = process.env.API_TSC;
const apiKey = process.env.APIKEY_TSC;
const concurrencyLimit = parseInt(process.env.API_TSC_LIMIT) || 2;
const ossEvalInner =
  process.env.NODE_ENV === 'production' ? 'oss-eval-inner' : 'oss-eval-inner-test';
const ossEval = process.env.NODE_ENV === 'production' ? 'oss-eval' : 'oss-eval-test';

const parserJson = (data: any) => {
  try {
    const start = data.indexOf('{');
    const end = data.lastIndexOf('}') + 1;
    if (start === -1 || end === -1) {
      logger.error(`Invalid JSON:${data}`);
      throw new Error('Invalid JSON');
    }
    return json5.parse(data.substring(start, end));
  } catch (error) {
    logger.error('Error parsing json:', error.message);
    return {};
  }
};

//访问API接口
const getDataFromAiUrl = async (repoInfo: any, catagoryRuleStr: string) => {
  try {
    const requestBody = {
      inputs: {
        GithubUrl: repoInfo.htmlUrl || repoInfo || '',
        topics: repoInfo.topics || '',
        description: repoInfo.description || '',
        readme: repoInfo.readme || '',
        catagoryRules: catagoryRuleStr || '',
      },
      response_mode: 'blocking',
      user: 'abc-123',
    };

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
    const response = await axios.post(apiUrl, requestBody, {
      headers,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    //解析JSON结果
    const result = response.data?.data?.outputs?.result;
    if (!result) {
      logger.error('AI接口调用失败', response.data?.data?.error, repoInfo.htmlUrl);
    }
    return parserJson(result || {});
  } catch (error) {
    logger.error('Error calling API:', error.message, repoInfo.htmlUrl);
  }
};

//控制AI接口调用频率的函数
async function rateLimitedCall(repoInfoList: any[], landscape: string) {
  const data = [];
  const delay = 2000;
  const catagoryRuleStr = await getCategoriesRuleJson(landscape);

  if (!repoInfoList === undefined || repoInfoList.length === 0) {
    return data;
  }

  for (let i = 0; i < repoInfoList.length; i += concurrencyLimit) {
    const batch = repoInfoList.slice(i, i + concurrencyLimit);
    const batchPromise = batch.map(repoInfo => getDataFromAiUrl(repoInfo, catagoryRuleStr));
    const batchResult = await Promise.all(batchPromise);
    batchResult.forEach((result, index) => {
      if (result instanceof Error || !result.GithubUrl) {
        logger.error(`处理${repoInfoList[i + index].htmlUrl}时出错：${result.message}`);
      } else {
        data.push({
          landscape: landscape || '',
          category: result.category || '',
          subcategory: result.subcategory || '',
          name: '',
          description: '',
          reasons: result.reasons || '',
          html_url: result.GithubUrl || '',
          github_id: -1,
          label: '',
          language: '',
        });
      }
    });
    if (i + concurrencyLimit < repoInfoList.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return data;
}

//获取软件信息
export async function getSoftWareRepoInfo(repoInfo: RepoInfo) {
  const projects = await LandscapeProjects.findAll({
    where: {
      landscape: repoInfo.landspace,
      htmlUrl: repoInfo.repoUrl,
    },
    attributes: ['landscape', 'htmlUrl'],
  });

  //转换为列表
  return projects.map(project => project.dataValues);
}

//通过入参landscape获取软件信息
export async function getSoftWareRepoInfoBylandscape(landscape: string) {
  const BASE_QUERY = `select distinct lp.name, lp.htmlUrl,gp.full_name,pro.readme_content
    from \`${ossEvalInner}\`.landscape_projects lp
    left join \`${ossEval}\`.github_projects_t gp on lp.htmlUrl - gp.html_url
    left join (select project_name, MAX(readme_content) as readme_content
    from \`${ossEvalInner}\`.project_metadata where is_valid =1
    group by project_name) pro on pro.project_name = gp.name
    where 1=1
    and lp.landscape = :landscape
    and lp.is_valid = 1`;
  return await sequelize.query(BASE_QUERY, {
    replacements: { landscape },
    type: sequelize.QueryTypes.SELECT,
  });
}

//通过repoUrls获取软件信息
export async function getSoftWareRepoInfoByUrls(repoUrls: string[]) {
  return await GithubProjectsTable.findAll({
    where: {
      html_url: {
        [Op.in]: repoUrls,
      },
    },
    attributes: [
      ['name', 'name'],
      ['html_url', 'htmlUrl'],
      ['topics', 'topics'],
      ['description', 'description'],
      ['full_name', 'full_name'],
    ],
  });
}

async function getCategoriesRule(landscape: string) {
  const sql = `select category, subcategory, description from \`${ossEvalInner}\`.landscape_categories where landscape = :landscape`;
  return await sequelize.query(sql, {
    replacements: { landscape },
    type: sequelize.QueryTypes.SELECT,
  });
}

//批量插入数据库
export async function insertLandscapeProjects(data: any) {
  try {
    await sequelize.transaction(async t => {
      await ProjectStackFromAi.bulkCreate(
        data,
        {
          updateOnDuplicate: [
            'landscape',
            'category',
            'subcategory',
            'name',
            'description',
            'reasons',
            'html_url',
            'github_id',
            'label',
            'language',
          ],
        },
        { transaction: t },
      );
    });
    logger.info('Batch insertion or update succeeded.');
  } catch (error) {
    logger.error(`Batch insertion or update failed: ${error}`);
    throw error;
  }
}

async function getCategoriesRuleJson(landscape: string) {
  const catagoryRules = await getCategoriesRule(landscape);
  if (!catagoryRules || catagoryRules.length === 0) {
    return '';
  } else {
    const catagoryRuleStr = JSON.stringify(catagoryRules);
    return catagoryRuleStr;
  }
}

export async function getTechnologyClassificationBatch(repoList: RepoList) {
  const landscape = repoList?.landscape;
  const repoUrls = repoList?.repoUrls;
  if (LandscapeProjects === null || ProjectStackFromAi === null) {
    logger.info('unsupported aiclassification');
    return 'unsupported aiclassification';
  }
  if (!apiKey || !apiUrl) {
    logger.error('API_TSC or APIURL_TSC not found');
    return 'API_TSC or APIURL_TSC not found';
  }

  if ((!repoUrls || repoUrls.length === 0) && (!landscape || landscape === '')) {
    throw new Error(`请检查参数repoUrls或landscape： ${repoUrls} ${landscape}不能同时为空。`);
  }

  let projectList;
  if (repoUrls.length > 0) {
    projectList = repoUrls;
  } else {
    projectList = await getSoftWareRepoInfoBylandscape(landscape);
  }
  try {
    const batches = Array.from({ length: Math.ceil(projectList.length / 10) }, (_, i) =>
      projectList.slice(i * 10, (i + 1) * 10),
    );
    const mergeData = [];
    for (const batch of batches) {
      const data = await rateLimitedCall(batch, landscape);
      await insertLandscapeProjects(data);
      mergeData.push(data);
    }
    return {
      data: mergeData,
      success: mergeData.length,
      failed: projectList.length - mergeData.length,
    };
  } catch (error) {
    logger.error(`Error processing project list: ${error.message}`);
    throw error;
  }
}
