import { exec } from 'node:child_process';
import util from 'node:util';
import {
  ProjectTechStack,
  Scorecard,
  sequelize,
  GithubProjects,
  logger,
} from '@orginjs/oss-evaluation-data-model';
import { ServerError, BadRequestError } from '../util/error.js';
import { parseRepoUrl } from '../util/util.js';
import { fetchWithTimeout } from '../util/fetchWitTimeout.js';

/**
 * Sync scorecard by id or by tech_stack from table:project_stack
 *
 * @param {*} req input including id and tech_stack(tech_stack will be ignored if id is present)
 * @param {*} res return result state
 * @returns
 */
export async function syncScorecardHandler(req, res) {
  try {
    // sync single project
    if (req.body.id) {
      const projectId = req.body.id;
      const project = await GithubProjects.findByPk(projectId);
      if (!project) {
        res.status(500).json({ error: 'can not find project!' });
        return;
      }
      const projectPath = project.htmlUrl.substring('https://'.length);
      const result = await syncScorecard(projectId, projectPath);
      res.status(200).json(result);
    } else if (req.body.category) {
      // sync a category
      const options = req.body.category === 'all' ? {} : { where: { category: req.body.category } };
      let projects = await ProjectTechStack.findAll(options);
      if (req.body.category === 'all') {
        logger.info('Starting full integration mode. Integrate all data from scratch!');
      }
      for (let project of projects) {
        await syncScorecard(project.projectId, project.html_url.substring('https://'.length)).catch(
          e => {
            logger.error(`Integration Failed! Failure from project ${e.message}`);
          },
        );
      }
      res.status(200).json({
        status: 'success',
        projects: projects.map(item => item.name),
      });
    }
    logger.info('Scorecard integration ends without error!');
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/**
 * Sync scorecard by input condition from table:github_projects
 * @param {*} req input including sql of searching table:github_projects, starting by 'select * from github_projects'
 * @param {*} res return result state
 */
export async function syncScorecardSpecial(req, res) {
  try {
    const sql = req.body.sql;
    let jobList = [];
    const [projectList] = await sequelize.query(sql);
    for (const project of projectList) {
      const projectPath = project.html_url.substring('https://'.length);
      const projectId = project.id;
      try {
        await syncScorecard(projectId, projectPath);
        jobList.push(`Success for ${project.html_url}`);
      } catch (e) {
        logger.info(e);
        jobList.push(`Failure for ${project.html_url}`);
      }
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

/**
 * Sync scorecard to mysql(run locally if no data online)
 * @param {string} projectId projectId of the project
 * @param {string} address project address（url of github without 'https://'）
 * @param {string} platform platform name，like 'github.com'
 * @param {string} org organization name
 * @param {string} repo repo name
 * @returns inserted data
 */
export async function syncScorecard(projectId, address, platform, org, repo) {
  let url = '';
  if (address && address.length > 0) {
    url = address;
  } else if (platform && org && repo) {
    url = `${platform}/${org}/${repo}`;
  } else {
    throw new BadRequestError();
  }

  if (!projectId) {
    const tempProject = await GithubProjects.findOne({ where: { htmlUrl: `https://${url}` } });
    projectId = tempProject.id;
  }
  // Obtain scorecard data
  let score;
  try {
    score = await getScorecard(url);
  } catch (e) {
    logger.error(e);
  }
  if (JSON.stringify(score) === '{}') {
    return;
  }

  // save scorecard score to sql
  const row = { ...score, projectId };
  const [data, created] = await Scorecard.findOrCreate({
    where: { projectId: row.projectId },
    defaults: row,
  });
  if (!created) {
    data.update(row);
  }
  return row;
}

/**
 * Get scorecard data
 * @param {string} url address of project without 'https://'
 * @returns score, score details, collection date, repo name, commit no., run locally or not
 */
export async function getScorecard(url) {
  try {
    const apiUrl = `https://api.securityscorecards.dev/projects/${url}`;
    const response = await fetchWithTimeout(apiUrl);
    let body;
    let isLocal;
    if (response.ok) {
      logger.info(`Fetching data of project ${url} online...`);
      body = await response.json();
      isLocal = false;
    } else {
      logger.info(`Fetching data of project ${url} failed! Running scorecard locally...`);
      let buffer;
      const execPromise = util.promisify(exec);
      await execPromise(
        `${process.platform === 'win32' ? 'scorecard-windows-amd64.exe' : 'scorecard'} --repo=${url} --format=json`,
        {
          env: { GITHUB_AUTH_TOKEN: process.env.GITHUB_AUTH_TOKEN },
        },
      )
        .then(value => {
          buffer = value.stdout;
        })
        .catch(error => {
          buffer = error.stdout;
          logger.error(error);
        });
      body = JSON.parse(buffer);
      isLocal = true;
    }
    const { checks } = body;
    const scoreMap = {};
    for (const item of checks) {
      let name = item.name;
      // 将名字转为驼峰
      if (name.includes('-')) {
        const firstWord = name.indexOf('-');
        name = name.replaceAll('-', '');
        name = name.replace(
          name.substring(0, firstWord),
          name.substring(0, firstWord).toLowerCase(),
        );
      } else {
        name = name.toLowerCase();
      }
      scoreMap[name] = item.score;
    }
    return {
      repoName: body.repo.name,
      collectionDate: body.date,
      score: body.score,
      commit: body.repo.commit,
      ...scoreMap,
      isLocal,
    };
  } catch (e) {
    throw new ServerError(e);
  }
}

export async function getScorecardHandler(req, res) {
  const { url } = req.body;
  try {
    const result = await getScorecard(url);
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send(e.toString());
  }
}

/**
 * Synchronize scorecard score for single project
 * @param projectUrl string html path for the project
 */
export async function syncSingleProjectScorecard(projectUrl) {
  const project = await GithubProjects.findOne({ where: { htmlUrl: projectUrl } });
  await syncSingleProjectScorecardByProject(project);
}

export async function syncSingleProjectScorecardByProject(project) {
  const { address, owner, repository } = parseRepoUrl(project.htmlUrl);
  await syncScorecard(project.id, null, address, owner, repository);
}

export async function syncSingleProjectScorecardHandler(req, res) {
  try {
    const url = req.body.url;
    await syncSingleProjectScorecard(url);
    res.status(200).send('Sync Success!');
  } catch (e) {
    res.status(500).send(e.toString());
  }
}
