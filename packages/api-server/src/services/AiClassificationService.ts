import {
  GithubProjectsTable,
  ProjectStackFromAi,
  LandscapeProjects,
  logger,
  sequelize,
} from '@orginjs/oss-evaluation-data-model';
import axios from 'axios';
import json5 from 'json5';
import { Op } from 'sequelize';
import type { RepoInfo } from '../interfaces/SoftwareInfo';

const apiUrl = process.env.API;
const apiKey = process.env.APIKEY;
const ossEvalInner =
  process.env.NODE_ENV === 'production' ? 'oss-eval-inner' : 'oss-eval-inner-test';
const ossEval = process.env.NODE_ENV === 'production' ? 'oss-eval' : 'oss-eval-test';

const parserJson = (data: any) => {
  try {
    const start = data.indexOf('{');
    const end = data.indexOf('}') + 1;
    if (start === -1 || end === -1) {
      throw new Error('Invalid JSON');
    }
    return json5.parse(data.substring(start, end));
  } catch (error) {
    logger.error('Error parsing json:', error.message);
    return null;
  }
};

//访问API接口
const getDataFromAiUrl = async (repoInfo: any, catagoryRuleStr: string) => {
  try {
    const requestBody = {
      inputs: {
        GithubUrl: repoInfo.htmlUrl || '',
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
    const response = await axios.post(apiUrl, requestBody, { headers });
    //解析JSON结果
    const result = parserJson(response.data?.data?.outputs?.result);
    return result;
  } catch (error) {
    logger.error('Error calling API:', error.message, repoInfo.htmlUrl);
    throw error;
  }
};

//工具函数，获取时间
const getDate = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

//控制AI接口调用频率的函数
async function rateLimitedCall(repoInfoList: any, catagoryRuleStr: string) {
  const data = [];
  const delay = 2000;
  let results = [];
  const landscape = repoInfoList[0].landscape ? repoInfoList[0].landscape : '';

  if (repoInfoList === undefined) {
    return data;
  }

  const htmlUrls = repoInfoList.map(repInfo => repInfo.htmlUrl);

  for (let i = 0; i < htmlUrls.length; i++) {
    logger.info('fetch start:', getDate());
    const result = getDataFromAiUrl(repoInfoList[i], catagoryRuleStr);
    logger.info('fetch end:', getDate());
    results.push(result);

    if (i < htmlUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  results = await Promise.all(results.map(result => result.catch(error => error)));

  results.forEach((result, index) => {
    if (result instanceof Error) {
      logger.error(`处理${repoInfoList[index].htmlUrl}时出错：${result.message}`);
    } else {
      data.push({
        landscape: landscape,
        category: result.category,
        subcategory: result.subcategory,
        name: '',
        description: '',
        reasons: result.reasons,
        html_url: result.GithubUrl,
        github_id: -1,
        label: '',
        language: '',
      });
    }
  });
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
export async function getSoftWareRepoInfoByUrls(repoUrls: string) {
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

export async function getTechnologyClassificationBatch(repoList: any) {
  if (LandscapeProjects === null || ProjectStackFromAi === null) {
    return 'unsupported aiclassification';
  }
  if (!apiKey || !apiUrl) {
    logger.error('apiKey or apiUrl not found');
    return 'apiKey or apiUrl not found';
  }
  if (!repoList) {
    throw new Error('repoList not found');
  }

  if (
    (!repoList.repoUrls || repoList.repoUrls.length === 0) &&
    (!repoList.landspace || repoList.landspace === '')
  ) {
    throw new Error(
      `请检查repoUrls或landspace： ${repoList.repoUrls} ${repoList.landspace}不能同时为空。`,
    );
  }

  let projectList;
  if (repoList.landspace !== '') {
    projectList = await getSoftWareRepoInfoBylandscape(repoList.landspace);
  } else {
    projectList = await getSoftWareRepoInfoByUrls(repoList.repoUrls);
  }
  try {
    const catagoryRuleStr = await getCategoriesRuleJson(repoList.landspace);
    const data = await rateLimitedCall(projectList, catagoryRuleStr);
    await insertLandscapeProjects(data);
    return data;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
}

export async function getTechnologyClassificationSingle(repoInfo: any) {
  if (LandscapeProjects === null || ProjectStackFromAi === null) {
    return 'unsupported aiclassification';
  }
  if (!apiKey || !apiUrl) {
    logger.error('apiKey or apiUrl not found');
    return 'apiKey or apiUrl not found';
  }
  try {
    const project = await getSoftWareRepoInfo(repoInfo);
    const catagoryRuleStr = await getCategoriesRuleJson(repoInfo.landspace);
    const data = await rateLimitedCall(project, catagoryRuleStr);
    await insertLandscapeProjects(data);
    return data;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
}
